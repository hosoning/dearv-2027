class_name DearVHud
extends CanvasLayer

@onready var prompt_panel: Control = $SafeArea/PromptPanel
@onready var prompt_label: Label = $SafeArea/PromptPanel/PromptLabel
@onready var inspector: Control = $Inspector
@onready var inspector_title: Label = $Inspector/Card/Header/Title
@onready var inspector_body: RichTextLabel = $Inspector/Card/Body


func _ready() -> void:
	prompt_panel.visible = false
	inspector.visible = false
	AppState.inspect_requested.connect(_open_inspector)
	AppState.inspect_closed.connect(_close_inspector)


func bind_player(player: ComfortController) -> void:
	player.focus_changed.connect(_on_focus_changed)


func _unhandled_input(event: InputEvent) -> void:
	if inspector.visible and (event.is_action_pressed("cancel") or event is InputEventScreenTouch and event.pressed):
		AppState.close_inspector()
		get_viewport().set_input_as_handled()


func _on_focus_changed(target: Interactable) -> void:
	prompt_panel.visible = target != null
	if target:
		prompt_label.text = target.get_prompt()


func _open_inspector(payload: Dictionary) -> void:
	inspector.visible = true
	inspector_title.text = str(payload.get("title", "Memory"))
	var story := str(payload.get("story", ""))
	var pages: Array = payload.get("pages", [])
	if not pages.is_empty():
		story += "\n\n" + "\n\n".join(PackedStringArray(pages))
	if str(payload.get("kind", "")) == "computer":
		story = "The in-world computer is connected. Apps and playable memories mount here without leaving the room."
	inspector_body.text = story


func _close_inspector() -> void:
	inspector.visible = false
