class_name DayNightDirector
extends Node

@export_range(0.0, 24.0, 0.1) var time_of_day := 16.8
@export_range(0.0, 2.0, 0.01) var time_scale := 0.0
@export var sun: DirectionalLight3D
@export var world_environment: WorldEnvironment


func _process(delta: float) -> void:
	if time_scale > 0.0:
		time_of_day = fmod(time_of_day + delta * time_scale, 24.0)
	_apply_time()


func _apply_time() -> void:
	var day_amount := smoothstep(-0.15, 0.25, sin((time_of_day - 6.0) / 24.0 * TAU))
	if sun:
		sun.rotation_degrees.x = remap(time_of_day, 0.0, 24.0, -90.0, 270.0)
		sun.light_energy = lerp(0.03, 1.05, day_amount)
		sun.light_color = Color("ffb47a").lerp(Color("fff5e2"), day_amount)
	if world_environment and world_environment.environment:
		world_environment.environment.ambient_light_energy = lerp(0.12, 0.72, day_amount)
