class_name DayNightDirector
extends Node

@export_range(0.0, 24.0, 0.1) var time_of_day := 16.8
@export_range(0.0, 2.0, 0.01) var time_scale := 0.0
@export var sync_to_system_clock := true
@export var sun: DirectionalLight3D
@export var world_environment: WorldEnvironment

var _clock_refresh := 0.0


func _ready() -> void:
	if sync_to_system_clock:
		_sync_clock()
	_apply_time()
	# Apartment geometry is created by a later sibling in the scene tree.
	call_deferred("_apply_time")


func _process(delta: float) -> void:
	if sync_to_system_clock:
		_clock_refresh += delta
		if _clock_refresh >= 30.0:
			_clock_refresh = 0.0
			_sync_clock()
			_apply_time()
	elif time_scale > 0.0:
		time_of_day = fmod(time_of_day + delta * time_scale, 24.0)
		_apply_time()


func _sync_clock() -> void:
	var now := Time.get_datetime_dict_from_system()
	time_of_day = float(now.get("hour", 16))
	time_of_day += float(now.get("minute", 0)) / 60.0
	time_of_day += float(now.get("second", 0)) / 3600.0


func _apply_time() -> void:
	var day_amount := smoothstep(-0.15, 0.25, sin((time_of_day - 6.0) / 24.0 * TAU))
	var night_amount := 1.0 - day_amount
	if sun:
		sun.rotation_degrees.x = remap(time_of_day, 0.0, 24.0, -90.0, 270.0)
		sun.light_energy = lerp(0.025, 1.05, day_amount)
		sun.light_color = Color("ffad73").lerp(Color("fff5e2"), day_amount)
	if world_environment and world_environment.environment:
		var environment := world_environment.environment
		environment.ambient_light_energy = lerp(0.10, 0.72, day_amount)
		environment.ambient_light_color = Color("465477").lerp(Color("c5d5e3"), day_amount)
		environment.background_color = Color("080d1d").lerp(Color("7598b3"), day_amount)

	# Distant windows share one material, so updating each unique instance is cheap
	# and lets the skyline wake naturally as the owner's local evening arrives.
	var updated_materials: Dictionary = {}
	for node in get_tree().get_nodes_in_group("city_night_emissive"):
		if not node is MeshInstance3D:
			continue
		var material := (node as MeshInstance3D).get_active_material(0)
		if not material is StandardMaterial3D or updated_materials.has(material):
			continue
		updated_materials[material] = true
		(material as StandardMaterial3D).emission_enabled = true
		(material as StandardMaterial3D).emission_energy_multiplier = lerp(0.08, 3.2, night_amount)
