class_name DoorInteractable
extends Interactable

@export var door_leaf: Node3D
@export_range(30.0, 160.0, 1.0) var open_degrees := 92.0
@export var open_seconds := 0.75
@export var starts_open := false
@export var lockable := false
@export var starts_locked := false

var _closed_rotation := Vector3.ZERO
var _is_open := false
var _is_locked := false
var _busy := false


func _ready() -> void:
	super._ready()
	prompt = "Open door"
	if door_leaf:
		_closed_rotation = door_leaf.rotation_degrees
	_is_open = bool(AppState.get_interaction_state(object_id, starts_open))
	if lockable:
		add_to_group("private_entry_door")
		_is_locked = bool(AppState.get_interaction_state("%s_locked" % object_id, starts_locked))
	_apply_immediate()


func get_prompt() -> String:
	if lockable and _is_locked:
		return "Front door locked"
	return "Close door" if _is_open else "Open door"


func can_interact(_actor: Node3D) -> bool:
	return not _busy and door_leaf != null


func interact(_actor: Node3D) -> void:
	if not can_interact(_actor):
		return
	if lockable and _is_locked:
		AppState.open_inspector({
			"title": "Front door",
			"story": "The private-home lock is engaged. Use the entry console tablet to unlock it.",
		})
		return
	_busy = true
	_is_open = not _is_open
	var target := _closed_rotation + Vector3(0.0, open_degrees if _is_open else 0.0, 0.0)
	var tween := create_tween().set_trans(Tween.TRANS_QUINT).set_ease(Tween.EASE_IN_OUT)
	tween.tween_property(door_leaf, "rotation_degrees", target, open_seconds)
	await tween.finished
	_busy = false
	persist(_is_open)


func is_locked() -> bool:
	return lockable and _is_locked


func set_locked(value: bool) -> bool:
	if not lockable or _busy or value == _is_locked:
		return value == _is_locked
	if value and _is_open:
		return false
	_is_locked = value
	AppState.set_interaction_state("%s_locked" % object_id, _is_locked)
	return true


func _apply_immediate() -> void:
	if door_leaf:
		door_leaf.rotation_degrees = _closed_rotation + Vector3(0.0, open_degrees if _is_open else 0.0, 0.0)
