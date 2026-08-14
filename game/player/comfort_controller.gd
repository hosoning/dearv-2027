class_name ComfortController
extends CharacterBody3D

signal focus_changed(target: Interactable)

@export var walk_speed := 3.2
@export var acceleration := 12.0
@export var deceleration := 16.0
@export var look_sensitivity := 0.0022
@export var touch_look_sensitivity := 0.003
@export var interaction_distance := 2.7
@export var camera_pitch_min := deg_to_rad(-48.0)
@export var camera_pitch_max := deg_to_rad(58.0)

@onready var camera: Camera3D = $CameraPivot/Camera3D
@onready var camera_pivot: Node3D = $CameraPivot

var _look_touch_id := -1
var _look_drag_distance := 0.0
var _focused: Interactable


func _ready() -> void:
	if not DisplayServer.is_touchscreen_available():
		Input.mouse_mode = Input.MOUSE_MODE_CAPTURED


func _unhandled_input(event: InputEvent) -> void:
	if AppState.is_inspecting:
		return
	if event is InputEventMouseMotion and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
		_apply_look(event.relative * look_sensitivity)
	elif event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT and event.pressed:
		_try_interact()
	elif event is InputEventKey and event.pressed and event.keycode == KEY_ESCAPE:
		Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	elif event is InputEventMouseButton and event.pressed and Input.mouse_mode == Input.MOUSE_MODE_VISIBLE:
		Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
	elif event is InputEventScreenTouch:
		if event.pressed and _look_touch_id == -1:
			_look_touch_id = event.index
			_look_drag_distance = 0.0
		elif not event.pressed and event.index == _look_touch_id:
			if _look_drag_distance < 18.0:
				_try_interact()
			_look_touch_id = -1
	elif event is InputEventScreenDrag and event.index == _look_touch_id:
		_look_drag_distance += event.relative.length()
		_apply_look(event.relative * touch_look_sensitivity)


func _physics_process(delta: float) -> void:
	var input := Input.get_vector("move_left", "move_right", "move_forward", "move_back")
	var forward := -global_transform.basis.z
	var right := global_transform.basis.x
	forward.y = 0.0
	right.y = 0.0
	var desired := (right.normalized() * input.x + forward.normalized() * -input.y).normalized() * walk_speed
	var rate := acceleration if desired.length_squared() > 0.01 else deceleration
	velocity.x = move_toward(velocity.x, desired.x, rate * delta)
	velocity.z = move_toward(velocity.z, desired.z, rate * delta)
	if not is_on_floor():
		velocity.y -= 9.8 * delta
	else:
		velocity.y = -0.2
	move_and_slide()
	_update_focus()
	if Input.is_action_just_pressed("interact"):
		_try_interact()


func _apply_look(delta_look: Vector2) -> void:
	rotate_y(-delta_look.x)
	camera_pivot.rotation.x = clamp(camera_pivot.rotation.x - delta_look.y, camera_pitch_min, camera_pitch_max)


func _update_focus() -> void:
	var target := _raycast_interactable()
	if target == _focused:
		return
	_focused = target
	focus_changed.emit(_focused)


func _try_interact() -> void:
	if _focused and _focused.can_interact(self):
		_focused.interact(self)


func _raycast_interactable() -> Interactable:
	var center := get_viewport().get_visible_rect().size * 0.5
	var origin := camera.project_ray_origin(center)
	var end := origin + camera.project_ray_normal(center) * interaction_distance
	var query := PhysicsRayQueryParameters3D.create(origin, end, 2)
	query.collide_with_areas = true
	query.collide_with_bodies = false
	var hit := get_world_3d().direct_space_state.intersect_ray(query)
	if hit.is_empty():
		return null
	return hit.collider as Interactable
