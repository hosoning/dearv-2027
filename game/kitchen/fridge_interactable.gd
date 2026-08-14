class_name FridgeInteractable
extends Interactable

@export var left_door: Node3D
@export var right_door: Node3D
@export var freezer_drawer: Node3D
@export var interior_light: Light3D
@export var open_seconds := 0.7
@export var inventory_location := "fridge"

var _left_closed := Vector3.ZERO
var _right_closed := Vector3.ZERO
var _freezer_closed := Vector3.ZERO
var _is_open := false
var _busy := false


func _ready() -> void:
	super._ready()
	if left_door:
		_left_closed = left_door.rotation_degrees
	if right_door:
		_right_closed = right_door.rotation_degrees
	if freezer_drawer:
		_freezer_closed = freezer_drawer.position
	_is_open = bool(AppState.get_interaction_state(object_id, false))
	_apply_immediate()


func get_prompt() -> String:
	return "Close refrigerator" if _is_open else "Open refrigerator"


func can_interact(_actor: Node3D) -> bool:
	return not _busy and left_door != null and right_door != null


func interact(actor: Node3D) -> void:
	if not can_interact(actor):
		return
	_busy = true
	_is_open = not _is_open
	var tween := create_tween().set_parallel().set_trans(Tween.TRANS_QUINT).set_ease(Tween.EASE_IN_OUT)
	tween.tween_property(left_door, "rotation_degrees", _left_closed + Vector3(0.0, -112.0 if _is_open else 0.0, 0.0), open_seconds)
	tween.tween_property(right_door, "rotation_degrees", _right_closed + Vector3(0.0, 112.0 if _is_open else 0.0, 0.0), open_seconds)
	if interior_light:
		create_tween().tween_property(interior_light, "light_energy", 1.1 if _is_open else 0.0, 0.22)
	await tween.finished
	_busy = false
	persist(_is_open)
	if _is_open:
		AppState.open_inspector({
			"kind": "inventory",
			"title": "Refrigerator",
			"location": inventory_location,
			"items": Kitchen.get_inventory(inventory_location),
		})


func _apply_immediate() -> void:
	if left_door:
		left_door.rotation_degrees = _left_closed + Vector3(0.0, -112.0 if _is_open else 0.0, 0.0)
	if right_door:
		right_door.rotation_degrees = _right_closed + Vector3(0.0, 112.0 if _is_open else 0.0, 0.0)
	if freezer_drawer:
		freezer_drawer.position = _freezer_closed + (Vector3(0.0, 0.0, -0.62) if _is_open else Vector3.ZERO)
	if interior_light:
		interior_light.light_energy = 1.1 if _is_open else 0.0
