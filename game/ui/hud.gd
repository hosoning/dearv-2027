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
var _comfort_pose_active := false
var _last_focus: Interactable
var _gift_story := ""
var _gift_pages: Array[String] = []
var _gift_page_index := 0
var _gift_previous_button: Button
var _gift_next_button: Button
var _control_hint_active := false


func _ready() -> void:
	prompt_panel.visible = false
	inspector.visible = false
	AppState.inspect_requested.connect(_open_inspector)
	AppState.inspect_closed.connect(_close_inspector)
	close_button.pressed.connect(AppState.close_inspector)


func bind_player(player: ComfortController) -> void:
	player.focus_changed.connect(_on_focus_changed)
	player.comfort_pose_changed.connect(_on_comfort_pose_changed)
	if not touch_overlay:
		touch_overlay = TouchControlsOverlay.new()
		touch_overlay.name = "TouchControlsOverlay"
		$SafeArea.add_child(touch_overlay)
		touch_overlay.move_to_front()
	touch_overlay.bind_player(player)
	call_deferred("_show_control_hint")


func _show_control_hint() -> void:
	if inspector.visible or _last_focus or _comfort_pose_active:
		return
	_control_hint_active = true
	prompt_panel.visible = true
	if DisplayServer.is_touchscreen_available():
		prompt_label.text = "Move with the left pad · look with the right pad · tap to interact"
	elif Input.get_connected_joypads().is_empty():
		prompt_label.text = "Move with WASD · look with the mouse · press E or click to interact"
	else:
		prompt_label.text = "Move and look with the sticks · press A to interact"
	await get_tree().create_timer(6.0).timeout
	if _control_hint_active and not _last_focus and not _comfort_pose_active:
		_control_hint_active = false
		prompt_panel.visible = false


func _unhandled_input(event: InputEvent) -> void:
	if inspector.visible and event.is_action_pressed("cancel"):
		AppState.close_inspector()
		get_viewport().set_input_as_handled()


func _on_focus_changed(target: Interactable) -> void:
	_last_focus = target
	if target:
		_control_hint_active = false
	if _comfort_pose_active:
		return
	prompt_panel.visible = target != null
	if target:
		prompt_label.text = target.get_prompt()


func _on_comfort_pose_changed(active: bool) -> void:
	_comfort_pose_active = active
	if active:
		prompt_panel.visible = true
		prompt_label.text = "Tap, click or press Interact to stand"
	else:
		_on_focus_changed(_last_focus)


func _open_inspector(payload: Dictionary) -> void:
	inspector.visible = true
	inspector_title.text = str(payload.get("title", "Memory"))
	_clear_actions()
	var story := str(payload.get("story", ""))
	var pages: Array = payload.get("pages", [])
	var kind := str(payload.get("kind", ""))
	match kind:
		"gift":
			_build_gift_page_actions(story, pages)
			call_deferred("_focus_first_action")
			return
		"computer":
			story = "The in-world computer connects this private 3D home to the DearV portal for letters, memories and account tools."
			_build_computer_actions()
		"inventory":
			story = "Choose an ingredient to place on the kitchen counter. The refrigerator door, light and inventory state are saved together."
			_build_inventory_actions(payload)
		"appliance":
			story = "Choose a recipe. Ingredients must first be taken from the refrigerator and placed on the counter."
			_build_appliance_actions(payload)
		"prep":
			story = "Wash or chop ingredients on the counter before cooking. Preparation state is saved automatically."
			_build_prep_actions(payload)
		"serving":
			story = "Bring a finished dish from the stove to the dining table. Served meals remain part of the saved home state."
			_build_serving_actions(payload)
	inspector_body.text = story
	call_deferred("_focus_first_action")


func _focus_first_action() -> void:
	for child in inspector_actions.get_children():
		if child is Button:
			var button := child as Button
			if not button.disabled:
				button.grab_focus()
				return
	close_button.grab_focus()


func _close_inspector() -> void:
	inspector.visible = false
	_clear_actions()


func _build_gift_page_actions(story: String, pages: Array) -> void:
	_gift_story = story
	_gift_pages.clear()
	for page in pages:
		_gift_pages.append(str(page))
	_gift_page_index = 0
	if _gift_pages.is_empty():
		inspector_body.text = _gift_story
		return

	_gift_previous_button = Button.new()
	_gift_previous_button.text = "Previous page"
	_gift_previous_button.pressed.connect(_change_gift_page.bind(-1))
	inspector_actions.add_child(_gift_previous_button)

	_gift_next_button = Button.new()
	_gift_next_button.text = "Next page"
	_gift_next_button.pressed.connect(_change_gift_page.bind(1))
	inspector_actions.add_child(_gift_next_button)
	_show_gift_page()


func _change_gift_page(direction: int) -> void:
	if _gift_pages.is_empty():
		return
	_gift_page_index = clampi(_gift_page_index + direction, 0, _gift_pages.size() - 1)
	_show_gift_page()


func _show_gift_page() -> void:
	if _gift_pages.is_empty():
		inspector_body.text = _gift_story
		return
	var page_header := "Page %d of %d" % [_gift_page_index + 1, _gift_pages.size()]
	inspector_body.text = "%s\n\n%s\n\n%s" % [_gift_story, page_header, _gift_pages[_gift_page_index]]
	if _gift_previous_button:
		_gift_previous_button.disabled = _gift_page_index == 0
	if _gift_next_button:
		_gift_next_button.disabled = _gift_page_index == _gift_pages.size() - 1


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


func _build_serving_actions(payload: Dictionary) -> void:
	var items: Array = payload.get("items", [])
	var serving_location := str(payload.get("serving_location", "dining_table"))
	var cooked_count := 0
	var plated_count := 0
	for value in items:
		if not value is Dictionary:
			continue
		var item := value as Dictionary
		var stage := str(item.get("stage", ""))
		var display_name := str(item.get("display_name", "Meal"))
		if stage == Kitchen.STAGE_COOKED:
			var button := Button.new()
			button.text = "Serve %s" % display_name
			button.pressed.connect(_serve_prepared_food.bind(str(item.get("instance_id", "")), serving_location))
			inspector_actions.add_child(button)
			cooked_count += 1
		elif stage == Kitchen.STAGE_PLATED and str(item.get("location", "")) == serving_location:
			var enjoy_button := Button.new()
			enjoy_button.text = "Enjoy %s" % display_name
			enjoy_button.pressed.connect(_enjoy_prepared_food.bind(str(item.get("instance_id", "")), serving_location))
			inspector_actions.add_child(enjoy_button)
			plated_count += 1
	if cooked_count == 0 and plated_count == 0:
		_add_disabled_action("Cook a meal at the induction stove first")


func _serve_prepared_food(instance_id: String, serving_location: String) -> void:
	if not Kitchen.plate_prepared_food(instance_id, serving_location):
		inspector_body.text = "That meal is no longer ready to serve."
		return
	_open_inspector({
		"kind": "serving",
		"title": "Dining table",
		"serving_location": serving_location,
		"items": Kitchen.get_prepared_food(),
	})


func _enjoy_prepared_food(instance_id: String, serving_location: String) -> void:
	if not Kitchen.enjoy_prepared_food(instance_id):
		inspector_body.text = "That meal is no longer on the table."
		return
	_open_inspector({
		"kind": "serving",
		"title": "Dining table",
		"serving_location": serving_location,
		"items": Kitchen.get_prepared_food(),
	})
	inspector_body.text = "The meal was enjoyed. This dining moment is saved to your home."


func _build_prep_actions(payload: Dictionary) -> void:
	var items: Array = payload.get("items", [])
	var action_count := 0
	for value in items:
		if not value is Dictionary:
			continue
		var item := value as Dictionary
		var definition_id := str(item.get("definition_id", ""))
		var definition: FoodDefinition = Kitchen.definitions.get(definition_id)
		if not definition:
			continue
		var instance_id := str(item.get("instance_id", ""))
		var stage := str(item.get("stage", Kitchen.STAGE_RAW))
		if definition.can_wash and stage == Kitchen.STAGE_RAW:
			_add_prep_action("Wash %s" % definition.display_name, instance_id, "wash")
			action_count += 1
		if definition.can_chop and stage in [Kitchen.STAGE_RAW, Kitchen.STAGE_WASHED]:
			_add_prep_action("Chop %s" % definition.display_name, instance_id, "chop")
			action_count += 1
	if items.is_empty():
		_add_disabled_action("Move ingredients here from the refrigerator")
	elif action_count == 0:
		_add_disabled_action("These ingredients are ready for cooking")


func _add_prep_action(label: String, instance_id: String, action: String) -> void:
	var button := Button.new()
	button.text = label
	button.pressed.connect(_prepare_food.bind(instance_id, action))
	inspector_actions.add_child(button)


func _prepare_food(instance_id: String, action: String) -> void:
	if not Kitchen.prepare_food(instance_id, action):
		inspector_body.text = "That preparation step is not available."
		return
	_open_inspector({
		"kind": "prep",
		"title": "Preparation counter",
		"items": Kitchen.get_inventory("counter"),
	})


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
	for index in range(recipe.required_ingredients.size()):
		var required_id := recipe.required_ingredients[index]
		var required_stage := recipe.required_stages[index] if index < recipe.required_stages.size() else ""
		var match_id := ""
		var has_unprepared_match := false
		for item in counter_items:
			var instance_id := str(item.get("instance_id", ""))
			if str(item.get("definition_id", "")) != required_id or selected.has(instance_id):
				continue
			var stage := str(item.get("stage", Kitchen.STAGE_RAW))
			if required_stage.is_empty() or stage == required_stage:
				match_id = instance_id
				break
			has_unprepared_match = true
		if match_id.is_empty():
			if has_unprepared_match:
				inspector_body.text = "%s must be %s at the preparation counter." % [_food_display_name(required_id), required_stage]
			else:
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
	_gift_previous_button = null
	_gift_next_button = null
	_gift_pages.clear()
	for child in inspector_actions.get_children():
		child.queue_free()
