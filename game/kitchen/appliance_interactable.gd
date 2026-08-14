class_name ApplianceInteractable
extends Interactable

@export var appliance_id := "stove"
@export var display_name := "Stove"
@export var indicator_light: Light3D
@export var active_emissive_mesh: MeshInstance3D

var selected_recipe := ""
var selected_ingredients: Array[String] = []


func _ready() -> void:
	super._ready()
	prompt = "Use %s" % display_name
	Kitchen.cooking_started.connect(_on_cooking_started)
	Kitchen.cooking_completed.connect(_on_cooking_completed)
	Kitchen.cooking_failed.connect(_on_cooking_failed)


func interact(_actor: Node3D) -> void:
	AppState.open_inspector({
		"kind": "appliance",
		"title": display_name,
		"appliance_id": appliance_id,
		"recipes": Kitchen.recipes.keys(),
		"counter_items": Kitchen.get_inventory("counter"),
	})


func cook(recipe_id: String, ingredient_ids: Array[String]) -> bool:
	selected_recipe = recipe_id
	selected_ingredients = ingredient_ids
	return await Kitchen.start_recipe(appliance_id, recipe_id, ingredient_ids)


func _on_cooking_started(id: String, _recipe_id: String) -> void:
	if id != appliance_id:
		return
	if indicator_light:
		indicator_light.light_energy = 1.0
	_set_emission(4.0)


func _on_cooking_completed(id: String, _result: Dictionary) -> void:
	if id != appliance_id:
		return
	if indicator_light:
		indicator_light.light_energy = 0.0
	_set_emission(0.0)


func _on_cooking_failed(id: String, reason: String) -> void:
	if id == appliance_id:
		push_warning("%s: %s" % [display_name, reason])


func _set_emission(energy: float) -> void:
	if not active_emissive_mesh:
		return
	var material := active_emissive_mesh.get_active_material(0)
	if material is StandardMaterial3D:
		material.emission_enabled = true
		material.emission_energy_multiplier = energy
