class_name DearVHud
extends CanvasLayer

@onready var prompt_panel: Control = $SafeArea/PromptPanel
@onready var prompt_label: Label = $SafeArea/PromptPanel/PromptLabel
@onready var inspector: Control = $Inspector
@onready var inspector_title: Label = $Inspector/Card/Content/Title
@onready var inspector_body: RichTextLabel = $Inspector/Card/Content/Body
@onready var inspector_actions: VBoxContainer = $Inspector/Card/Content/Actions
@onready var close_button: Button = $Inspector/Card/Content/Close

var touch_overlay: TouchControlsOverlay


func _ready() -> void:
	prompt_panel.visible = false
	inspector.visible = false
	AppState.inspect_requested.connect(_open_inspector)
	AppState.inspect_closed.connect(_close_inspector)
	close_button.pressed.connect(AppState.close_inspector)


func bind_player(player: ComfortController) -> void:
	player.focus_changed.connect(_on_focus_changed)
	if not touch_overlay:
		touch_overlay = TouchControlsOverlay.new()
		touch_overlay.name = "TouchControlsOverlay"
		$SafeArea.add_child(touch_overlay)
		touch_overlay.move_to_front()
	touch_overlay.bind_player(player)


func _unhandled_input(event: InputEvent) -> void:
	if inspector.visible and event.is_action_pressed("cancel"):
		AppState.close_inspector()
		get_viewport().set_input_as_handled()


func _on_focus_changed(target: Interactable) -> void:
	prompt_panel.visible = target != null
	if target:
		prompt_label.text = target.get_prompt()


func _open_inspector(payload: Dictionary) -> void:
	inspector.visible = true
	inspector_title.text = str(payload.get("title", "Memory"))
	_clear_actions()
	var story := str(payload.get("story", ""))
	var pages: Array = payload.get("pages", [])
	if not pages.is_empty():
		story += "\n\n" + "\n\n".join(PackedStringArray(pages))
	var kind := str(payload.get("kind", ""))
	match kind:
		"computer":
			story = "The in-world computer connects this private 3D home to the DearV portal for letters, memories and account tools."
			_build_computer_actions()
		"inventory":
			story = "Choose an ingredient to place on the kitchen counter. The refrigerator door, light and inventory state are saved together."
			_build_inventory_actions(payload)
		"appliance":
			story = "Choose a recipe. Ingredients must first be taken from the refrigerator and placed on the counter."
			_build_appliance_actions(payload)
	inspector_body.text = story


func _close_inspector() -> void:
	inspector.visible = false
	_clear_actions()


func _build_computer_actions() -> void:
	var portal_button := Button.new()
	portal_button.text = "Open DearV letters and memories"
	portal_button.tooltip_text = "Opens the private DearV portal in a new browser tab"
	portal_button.pressed.connect(_open_dearv_portal)
	inspector_actions.add_child(portal_button)

	var resume_button := Button.new()
	resume_button.text = "Return to the 3D home"
	resume_button.pressed.connect(AppState.close_inspector)
	inspector_actions.add_child(resume_button)


func _open_dearv_portal() -> void:
	if OS.has_feature("web"):
		JavaScriptBridge.eval("window.open('../', '_blank', 'noopener,noreferrer');")
	else:
		OS.shell_open("https://hosoning.github.io/dearv-2027/")


func _build_inventory_actions(payload: Dictionary) -> void:
	var items: Array = payload.get("items", [])
	if items.is_empty():
		_add_disabled_action("The refrigerator is empty")
		return
	for value in items:
		if not value is Dictionary:
			continue
		var item := value as Dictionary
		var button := Button.new()
		button.text = "Take %s to counter" % _food_display_name(str(item.get("definition_id", "")))
		button.pressed.connect(_move_food_to_counter.bind(str(item.get("instance_id", ""))))
		inspector_actions.add_child(button)


func _build_appliance_actions(payload: Dictionary) -> void:
	var target := payload.get("target") as ApplianceInteractable
	var recipes: Array = payload.get("recipes", [])
	if not target or recipes.is_empty():
		_add_disabled_action("No recipe is available")
		return
	for recipe_value in recipes:
		var recipe_id := str(recipe_value)
		var recipe: RecipeDefinition = Kitchen.recipes.get(recipe_id)
		if not recipe:
			continue
		var button := Button.new()
		button.text = "Cook %s" % recipe.display_name
		button.pressed.connect(_start_recipe.bind(target, recipe_id))
		inspector_actions.add_child(button)


func _move_food_to_counter(instance_id: String) -> void:
	if not Kitchen.move_food(instance_id, "counter"):
		inspector_body.text = "That ingredient is no longer available."
		return
	_open_inspector({
		"kind": "inventory",
		"title": "Refrigerator",
		"items": Kitchen.get_inventory("fridge"),
	})


func _start_recipe(appliance: ApplianceInteractable, recipe_id: String) -> void:
	var recipe: RecipeDefinition = Kitchen.recipes.get(recipe_id)
	if not recipe:
		return
	var counter_items := Kitchen.get_inventory("counter")
	var selected: Array[String] = []
	for required_id in recipe.required_ingredients:
		var match_id := ""
		for item in counter_items:
			var instance_id := str(item.get("instance_id", ""))
			if str(item.get("definition_id", "")) == required_id and not selected.has(instance_id):
				match_id = instance_id
				break
		if match_id.is_empty():
			inspector_body.text = "Missing %s. Take it from the refrigerator first." % _food_display_name(required_id)
			return
		selected.append(match_id)
	inspector_body.text = "Cooking %s…" % recipe.display_name
	_set_actions_disabled(true)
	var completed := await appliance.cook(recipe_id, selected)
	_set_actions_disabled(false)
	inspector_body.text = "%s is ready and saved to your kitchen." % recipe.display_name if completed else "Cooking could not start."


func _food_display_name(definition_id: String) -> String:
	var definition: FoodDefinition = Kitchen.definitions.get(definition_id)
	return definition.display_name if definition else definition_id.capitalize()


func _add_disabled_action(label: String) -> void:
	var button := Button.new()
	button.text = label
	button.disabled = true
	inspector_actions.add_child(button)


func _set_actions_disabled(disabled: bool) -> void:
	for child in inspector_actions.get_children():
		if child is Button:
			var button := child as Button
			button.disabled = disabled


func _clear_actions() -> void:
	for child in inspector_actions.get_children():
		child.queue_free()
