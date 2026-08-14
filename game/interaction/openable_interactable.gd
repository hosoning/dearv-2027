class_name OpenableInteractable
extends Interactable

enum MotionType { HINGE, SLIDE, DRAWER }

@export var moving_part: Node3D
@export var motion_type := MotionType.HINGE
@export var open_rotation_degrees := Vector3(0.0, 95.0, 0.0)
@export var open_offset := Vector3.ZERO
@export_range(0.15, 2.0, 0.05) var motion_seconds := 0.65
@export var starts_open := false
@export var open_label := "Open"
@export var close_label := "Close"

var _closed_position := Vector3.ZERO
var _closed_rotation := Vector3.ZERO
var _is_open := false
var _busy := false


func _ready() -> void:
	super._ready()
	if moving_part:
		_closed_position = moving_part.position
		_closed_rotation = moving_part.rotation_degrees
	_is_open = bool(AppState.get_interaction_state(object_id, starts_open))
	_apply_immediate()


func get_prompt() -> String:
	return close_label if _is_open else open_label


func can_interact(_actor: Node3D) -> bool:
	return moving_part != null and not _busy


func interact(actor: Node3D) -> void:
	if not can_interact(actor):
		return
	_busy = true
	_is_open = not _is_open
	var target_position := _closed_position + (open_offset if _is_open else Vector3.ZERO)
	var target_rotation := _closed_rotation + (open_rotation_degrees if _is_open else Vector3.ZERO)
	var tween := create_tween().set_parallel().set_trans(Tween.TRANS_QUINT).set_ease(Tween.EASE_IN_OUT)
	if motion_type != MotionType.HINGE or open_offset != Vector3.ZERO:
		tween.tween_property(moving_part, "position", target_position, motion_seconds)
	if motion_type == MotionType.HINGE or open_rotation_degrees != Vector3.ZERO:
		tween.tween_property(moving_part, "rotation_degrees", target_rotation, motion_seconds)
	await tween.finished
	_busy = false
	persist(_is_open)


func is_open() -> bool:
	return _is_open


func _apply_immediate() -> void:
	if not moving_part:
		return
	moving_part.position = _closed_position + (open_offset if _is_open else Vector3.ZERO)
	moving_part.rotation_degrees = _closed_rotation + (open_rotation_degrees if _is_open else Vector3.ZERO)
