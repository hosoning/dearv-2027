extends Node

signal inventory_changed(location: String)
signal food_stage_changed(instance_id: String, stage: String)
signal cooking_started(appliance_id: String, recipe_id: String)
signal cooking_completed(appliance_id: String, result: Dictionary)
signal cooking_failed(appliance_id: String, reason: String)

const STAGE_RAW := "raw"
const STAGE_WASHED := "washed"
const STAGE_CHOPPED := "chopped"
const STAGE_COOKED := "cooked"
const STAGE_PLATED := "plated"
const STAGE_BURNT := "burnt"

var definitions: Dictionary = {}
var recipes: Dictionary = {}
var active_appliances: Dictionary = {}


func register_food(definition: FoodDefinition) -> void:
	if definition and not definition.id.is_empty():
		definitions[definition.id] = definition


func register_recipe(recipe: RecipeDefinition) -> void:
	if recipe and not recipe.id.is_empty():
		recipes[recipe.id] = recipe


func create_food(definition_id: String, location := "fridge") -> Dictionary:
	if not definitions.has(definition_id):
		return {}
	var instance_id := "%s-%s" % [definition_id, str(Time.get_ticks_usec())]
	var item := {
		"instance_id": instance_id,
		"definition_id": definition_id,
		"stage": STAGE_RAW,
		"location": location,
		"created_at": Time.get_datetime_string_from_system(true),
	}
	AppState.inventory[instance_id] = item
	SaveRepository.queue_save()
	inventory_changed.emit(location)
	return item


func move_food(instance_id: String, target_location: String) -> bool:
	if not AppState.inventory.has(instance_id):
		return false
	var item: Dictionary = AppState.inventory[instance_id]
	var old_location := str(item.get("location", ""))
	item["location"] = target_location
	AppState.inventory[instance_id] = item
	SaveRepository.queue_save()
	inventory_changed.emit(old_location)
	inventory_changed.emit(target_location)
	return true


func get_inventory(location: String) -> Array[Dictionary]:
	var result: Array[Dictionary] = []
	for value in AppState.inventory.values():
		if value is Dictionary and str(value.get("location", "")) == location:
			result.append(value)
	return result


func prepare_food(instance_id: String, action: String) -> bool:
	if not AppState.inventory.has(instance_id):
		return false
	var item: Dictionary = AppState.inventory[instance_id]
	var definition: FoodDefinition = definitions.get(str(item.get("definition_id", "")))
	if not definition:
		return false
	var current := str(item.get("stage", STAGE_RAW))
	var next := ""
	match action:
		"wash":
			if definition.can_wash and current == STAGE_RAW:
				next = STAGE_WASHED
		"chop":
			if definition.can_chop and current in [STAGE_RAW, STAGE_WASHED]:
				next = STAGE_CHOPPED
		"plate":
			if current == STAGE_COOKED:
				next = STAGE_PLATED
	if next.is_empty():
		return false
	item["stage"] = next
	AppState.inventory[instance_id] = item
	SaveRepository.queue_save()
	food_stage_changed.emit(instance_id, next)
	return true


func get_prepared_food(location := "") -> Array[Dictionary]:
	var result: Array[Dictionary] = []
	for value in AppState.prepared_food.values():
		if not value is Dictionary:
			continue
		var item := value as Dictionary
		if location.is_empty() or str(item.get("location", "")) == location:
			result.append(item)
	return result


func plate_prepared_food(instance_id: String, target_location := "dining_table") -> bool:
	if not AppState.prepared_food.has(instance_id):
		return false
	var item: Dictionary = AppState.prepared_food[instance_id]
	if str(item.get("stage", "")) != STAGE_COOKED:
		return false
	item["stage"] = STAGE_PLATED
	item["location"] = target_location
	AppState.prepared_food[instance_id] = item
	SaveRepository.queue_save()
	return true


func start_recipe(appliance_id: String, recipe_id: String, ingredient_ids: Array[String]) -> bool:
	if active_appliances.has(appliance_id) or not recipes.has(recipe_id):
		return false
	var recipe: RecipeDefinition = recipes[recipe_id]
	var validation := _validate_recipe(recipe, ingredient_ids)
	if not validation.ok:
		cooking_failed.emit(appliance_id, validation.reason)
		return false
	active_appliances[appliance_id] = {"recipe_id": recipe_id, "ingredients": ingredient_ids}
	cooking_started.emit(appliance_id, recipe_id)
	await get_tree().create_timer(recipe.cook_seconds).timeout
	if not active_appliances.has(appliance_id):
		return false
	var result := _complete_recipe(recipe, ingredient_ids, appliance_id)
	active_appliances.erase(appliance_id)
	cooking_completed.emit(appliance_id, result)
	return true


func stop_appliance(appliance_id: String) -> void:
	active_appliances.erase(appliance_id)


func _validate_recipe(recipe: RecipeDefinition, ingredient_ids: Array[String]) -> Dictionary:
	if ingredient_ids.size() != recipe.required_ingredients.size():
		return {"ok": false, "reason": "Wrong number of ingredients"}
	var remaining: Array[Dictionary] = []
	for index in range(recipe.required_ingredients.size()):
		remaining.append({
			"definition_id": recipe.required_ingredients[index],
			"stage": recipe.required_stages[index] if index < recipe.required_stages.size() else "",
		})
	for instance_id in ingredient_ids:
		if not AppState.inventory.has(instance_id):
			return {"ok": false, "reason": "Ingredient is missing"}
		var item: Dictionary = AppState.inventory[instance_id]
		var definition_id := str(item.get("definition_id", ""))
		var stage := str(item.get("stage", STAGE_RAW))
		var definition_match := -1
		var exact_match := -1
		for index in range(remaining.size()):
			if str(remaining[index].get("definition_id", "")) != definition_id:
				continue
			definition_match = index
			var required_stage := str(remaining[index].get("stage", ""))
			if required_stage.is_empty() or required_stage == stage:
				exact_match = index
				break
		if exact_match >= 0:
			remaining.remove_at(exact_match)
		elif definition_match >= 0:
			var required_stage := str(remaining[definition_match].get("stage", "prepared"))
			return {"ok": false, "reason": "%s must be %s first" % [definition_id.capitalize(), required_stage]}
		else:
			return {"ok": false, "reason": "Ingredients do not match this recipe"}
	return {"ok": true, "reason": ""}


func _complete_recipe(recipe: RecipeDefinition, ingredient_ids: Array[String], appliance_id: String) -> Dictionary:
	for instance_id in ingredient_ids:
		AppState.inventory.erase(instance_id)
	var result_id := "%s-%s" % [recipe.id, str(Time.get_ticks_usec())]
	var result := {
		"instance_id": result_id,
		"recipe_id": recipe.id,
		"display_name": recipe.display_name,
		"stage": STAGE_COOKED,
		"location": appliance_id,
	}
	AppState.prepared_food[result_id] = result
	SaveRepository.queue_save()
	return result
