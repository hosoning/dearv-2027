class_name ComfortController
extends CharacterBody3D

signal focus_changed(target: Interactable)
signal comfort_pose_changed(active: bool)
signal touch_move_changed(origin: Vector2, current: Vector2, active: bool)
signal touch_look_changed(origin: Vector2, current: Vector2, active: bool)

@export var walk_speed := 3.2
@export var acceleration := 12.0
@export var deceleration := 16.0
@export var look_sensitivity := 0.0022
@export var touch_look_sensitivity := 0.003
@export_range(0.5, 5.0, 0.1) var gamepad_look_speed := 2.4
@export_range(0.05, 0.45, 0.01) var gamepad_look_deadzone := 0.16
@export var touch_move_radius := 92.0
@export var interaction_distance := 2.7
@export var camera_pitch_min := deg_to_rad(-48.0)
@export var camera_pitch_max := deg_to_rad(58.0)
@export_range(0.0, 0.04, 0.001) var head_bob_height := 0.014
@export_range(0.0, 0.03, 0.001) var head_bob_sway := 0.008
@export_range(0.5, 2.5, 0.05) var head_bob_steps_per_meter := 1.45
@export_range(0.0, 3.0, 0.1) var movement_fov_boost := 1.4

@onready var camera: Camera3D = $CameraPivot/Camera3D
@onready var camera_pivot: Node3D = $CameraPivot

var _move_touch_id := -1
var _move_touch_origin := Vector2.ZERO
var _move_touch_current := Vector2.ZERO
var _touch_move := Vector2.ZERO
var _look_touch_id := -1
var _look_touch_origin := Vector2.ZERO
var _look_touch_current := Vector2.ZERO
var _look_drag_distance := 0.0
var _focused: Interactable
var _pose_locked := false
var _standing_transform := Transform3D.IDENTITY
var _standing_camera_position := Vector3.ZERO
var _pose_tween: Tween
var _camera_rest_position := Vector3.ZERO
var _camera_base_fov := 64.0
var _bob_phase := 0.0
var _location_save_timer: Timer
var _last_saved_position := Vector3.INF
var _last_saved_yaw := INF


func _ready() -> void:
	_camera_rest_position = camera.position
	_camera_base_fov = camera.fov
	if not DisplayServer.is_touchscreen_available():
		Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
	_location_save_timer = Timer.new()
	_location_save_timer.wait_time = 10.0
	_location_save_timer.timeout.connect(_save_home_location)
	add_child(_location_save_timer)
	_location_save_timer.start()
	call_deferred("_restore_home_location")


func _restore_home_location() -> void:
	var saved: Variant = AppState.get_interaction_state("player_home_location")
	if not saved is Dictionary:
		_last_saved_position = global_position
		_last_saved_yaw = rotation.y
		return
	var location := saved as Dictionary
	var position_value: Variant = location.get("position", [])
	if not position_value is Array or position_value.size() < 3:
		return
	var restored := Vector3(
		float(position_value[0]),
		float(position_value[1]),
		float(position_value[2])
	)
	if absf(restored.x) > 24.0 or restored.y < -0.5 or restored.y > 5.0 or absf(restored.z) > 20.0:
		return
	global_position = restored
	rotation.y = float(location.get("yaw", rotation.y))
	camera_pivot.rotation.x = clampf(
		float(location.get("pitch", camera_pivot.rotation.x)),
		camera_pitch_min,
		camera_pitch_max
	)
	_last_saved_position = global_position
	_last_saved_yaw = rotation.y


func _save_home_location() -> void:
	if _pose_locked or AppState.is_inspecting:
		return
	var moved := _last_saved_position == Vector3.INF or global_position.distance_to(_last_saved_position) > 0.25
	var turned := is_inf(_last_saved_yaw) or absf(angle_difference(rotation.y, _last_saved_yaw)) > 0.12
	if not moved and not turned:
		return
	AppState.set_interaction_state("player_home_location", {
		"position": [global_position.x, global_position.y, global_position.z],
		"yaw": rotation.y,
		"pitch": camera_pivot.rotation.x,
		"saved_at": Time.get_datetime_string_from_system(true),
	})
	_last_saved_position = global_position
	_last_saved_yaw = rotation.y


func _unhandled_input(event: InputEvent) -> void:
	if AppState.is_inspecting:
		return
	if _pose_locked:
		var pointer_exit := event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT and event.pressed
		var touch_exit := event is InputEventScreenTouch and not event.pressed
		if event.is_action_pressed("cancel") or event.is_action_pressed("interact") or pointer_exit or touch_exit:
			exit_comfort_pose()
			get_viewport().set_input_as_handled()
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
		_handle_screen_touch(event)
	elif event is InputEventScreenDrag:
		_handle_screen_drag(event)


func _handle_screen_touch(event: InputEventScreenTouch) -> void:
	var half_width := get_viewport().get_visible_rect().size.x * 0.5
	if event.pressed:
		if event.position.x < half_width and _move_touch_id == -1:
			_move_touch_id = event.index
			_move_touch_origin = event.position
			_move_touch_current = event.position
			_touch_move = Vector2.ZERO
			touch_move_changed.emit(_move_touch_origin, _move_touch_current, true)
		elif _look_touch_id == -1:
			_look_touch_id = event.index
			_look_touch_origin = event.position
			_look_touch_current = event.position
			_look_drag_distance = 0.0
			touch_look_changed.emit(_look_touch_origin, _look_touch_current, true)
		return

	if event.index == _move_touch_id:
		_move_touch_id = -1
		_touch_move = Vector2.ZERO
		touch_move_changed.emit(_move_touch_origin, event.position, false)
	elif event.index == _look_touch_id:
		if _look_drag_distance < 18.0:
			_try_interact()
		_look_touch_id = -1
		touch_look_changed.emit(_look_touch_origin, event.position, false)


func _handle_screen_drag(event: InputEventScreenDrag) -> void:
	if event.index == _move_touch_id:
		_move_touch_current = event.position
		var offset := _move_touch_current - _move_touch_origin
		var clamped := offset.limit_length(touch_move_radius)
		_touch_move = clamped / touch_move_radius
		touch_move_changed.emit(_move_touch_origin, _move_touch_origin + clamped, true)
	elif event.index == _look_touch_id:
		_look_touch_current = event.position
		_look_drag_distance += event.relative.length()
		_apply_look(event.relative * touch_look_sensitivity)
		touch_look_changed.emit(_look_touch_origin, _look_touch_current, true)


func _physics_process(delta: float) -> void:
	_update_gamepad_look(delta)
	if _pose_locked:
		velocity = Vector3.ZERO
		_update_camera_motion(delta, 0.0)
		_update_focus()
		return
	var input := Input.get_vector("move_left", "move_right", "move_forward", "move_back")
	if _touch_move.length_squared() > input.length_squared():
		# Screen-space joystick: up means forward, down means back.
		input = Vector2(_touch_move.x, _touch_move.y)
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
	_update_camera_motion(delta, Vector2(velocity.x, velocity.z).length())
	_update_focus()
	if Input.is_action_just_pressed("interact"):
		_try_interact()


func _update_gamepad_look(delta: float) -> void:
	var joypads := Input.get_connected_joypads()
	if joypads.is_empty():
		return
	var device_id: int = int(joypads[0])
	var stick := Vector2(
		Input.get_joy_axis(device_id, JOY_AXIS_RIGHT_X),
		Input.get_joy_axis(device_id, JOY_AXIS_RIGHT_Y)
	)
	var strength := stick.length()
	if strength <= gamepad_look_deadzone:
		return
	var scaled_strength := clampf((strength - gamepad_look_deadzone) / (1.0 - gamepad_look_deadzone), 0.0, 1.0)
	_apply_look(stick.normalized() * scaled_strength * gamepad_look_speed * delta)


func _update_camera_motion(delta: float, horizontal_speed: float) -> void:
	var target_position := _camera_rest_position
	var moving := horizontal_speed > 0.12 and is_on_floor() and not _pose_locked
	if moving:
		_bob_phase += delta * horizontal_speed * TAU * head_bob_steps_per_meter
		target_position.x += cos(_bob_phase) * head_bob_sway
		target_position.y += sin(_bob_phase * 2.0) * head_bob_height
	else:
		_bob_phase = fmod(_bob_phase, TAU)
	var smoothing := 1.0 - exp(-delta * 12.0)
	camera.position = camera.position.lerp(target_position, smoothing)
	var speed_ratio := clampf(horizontal_speed / maxf(walk_speed, 0.01), 0.0, 1.0)
	var target_fov := _camera_base_fov + speed_ratio * movement_fov_boost
	camera.fov = lerpf(camera.fov, target_fov, 1.0 - exp(-delta * 6.0))


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


func enter_comfort_pose(anchor: Node3D, camera_height := 1.18) -> void:
	if _pose_locked or not anchor:
		return
	_standing_transform = global_transform
	_standing_camera_position = camera_pivot.position
	global_position = anchor.global_position
	rotation.y = anchor.global_rotation.y
	_pose_locked = true
	comfort_pose_changed.emit(true)
	_animate_camera_position(Vector3(_standing_camera_position.x, camera_height, _standing_camera_position.z))


func exit_comfort_pose() -> void:
	if not _pose_locked:
		return
	global_transform = _standing_transform
	_pose_locked = false
	comfort_pose_changed.emit(false)
	_animate_camera_position(_standing_camera_position)


func _animate_camera_position(target: Vector3) -> void:
	if _pose_tween and _pose_tween.is_valid():
		_pose_tween.kill()
	_pose_tween = create_tween()
	_pose_tween.set_trans(Tween.TRANS_SINE)
	_pose_tween.set_ease(Tween.EASE_IN_OUT)
	_pose_tween.tween_property(camera_pivot, "position", target, 0.28)
