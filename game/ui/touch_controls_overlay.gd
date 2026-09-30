class_name TouchControlsOverlay
extends Control

var move_active := false
var move_origin := Vector2.ZERO
var move_current := Vector2.ZERO
var look_active := false
var look_origin := Vector2.ZERO
var look_current := Vector2.ZERO


func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	visible = DisplayServer.is_touchscreen_available() or OS.has_feature("web_android") or OS.has_feature("web_ios")


func bind_player(player: ComfortController) -> void:
	player.touch_move_changed.connect(_on_move_changed)
	player.touch_look_changed.connect(_on_look_changed)


func _on_move_changed(origin: Vector2, current: Vector2, active: bool) -> void:
	move_origin = origin
	move_current = current
	move_active = active
	queue_redraw()


func _on_look_changed(origin: Vector2, current: Vector2, active: bool) -> void:
	look_origin = origin
	look_current = current
	look_active = active
	queue_redraw()


func _draw() -> void:
	if move_active:
		_draw_joystick(move_origin, move_current, 92.0, Color(0.96, 0.89, 0.78, 0.11), Color(0.96, 0.89, 0.78, 0.31))
	if look_active:
		# Right side should remain much quieter than the movement control.
		draw_circle(look_origin, 40.0, Color(0.95, 0.90, 0.84, 0.045))
		draw_arc(look_origin, 40.0, 0.0, TAU, 40, Color(0.95, 0.90, 0.84, 0.13), 1.2, true)
		var delta := (look_current - look_origin).limit_length(36.0)
		draw_circle(look_origin + delta, 7.0, Color(0.95, 0.90, 0.84, 0.18))


func _draw_joystick(origin: Vector2, current: Vector2, radius: float, base_color: Color, knob_color: Color) -> void:
	draw_circle(origin, radius, base_color)
	draw_arc(origin, radius, 0.0, TAU, 64, Color(0.96, 0.89, 0.78, 0.2), 1.5, true)
	var offset := (current - origin).limit_length(radius)
	var knob := origin + offset
	draw_circle(knob, 31.0, knob_color)
	draw_arc(knob, 31.0, 0.0, TAU, 48, Color(1.0, 0.94, 0.86, 0.38), 1.4, true)
