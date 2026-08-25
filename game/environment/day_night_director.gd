class_name DayNightDirector
extends Node

@export_range(0.0, 24.0, 0.1) var time_of_day := 16.8
@export_range(0.0, 2.0, 0.01) var time_scale := 0.0
@export var sync_to_system_clock := true
@export var sun: DirectionalLight3D
@export var world_environment: WorldEnvironment

var _clock_refresh := 0.0
var atmosphere_mode := "system"
var procedural_sky: ProceduralSkyMaterial


func _ready() -> void:
	add_to_group("day_night_director")
	_ensure_procedural_sky()
	var saved_mode := str(AppState.get_interaction_state("home_atmosphere", "system"))
	set_atmosphere(saved_mode, false)
	# Apartment geometry is created by a later sibling in the scene tree.
	call_deferred("_apply_time")


func _ensure_procedural_sky() -> void:
	if not world_environment or not world_environment.environment:
		return
	procedural_sky = ProceduralSkyMaterial.new()
	procedural_sky.sun_angle_max = 7.5
	procedural_sky.sun_curve = 0.055
	var sky := Sky.new()
	sky.sky_material = procedural_sky
	world_environment.environment.sky = sky
	world_environment.environment.background_mode = Environment.BG_SKY


func set_atmosphere(mode: String, persist := true) -> void:
	if not mode in ["system", "morning", "sunset", "night"]:
		mode = "system"
	atmosphere_mode = mode
	sync_to_system_clock = mode == "system"
	match mode:
		"system":
			_sync_clock()
		"morning":
			time_of_day = 8.25
		"sunset":
			time_of_day = 18.35
		"night":
			time_of_day = 22.0
	_apply_time()
	if persist:
		AppState.set_interaction_state("home_atmosphere", atmosphere_mode)


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
	var dusk_distance := min(abs(time_of_day - 18.35), abs(time_of_day - 6.35))
	var dusk_amount := exp(-pow(dusk_distance / 1.18, 2.0))
	if sun:
		sun.rotation_degrees.x = remap(time_of_day, 0.0, 24.0, -90.0, 270.0)
		sun.light_energy = lerp(0.025, 1.05, day_amount)
		sun.light_color = Color("ffad73").lerp(Color("fff5e2"), day_amount)
	if world_environment and world_environment.environment:
		var environment := world_environment.environment
		environment.ambient_light_energy = lerp(0.10, 0.72, day_amount)
		environment.ambient_light_color = Color("465477").lerp(Color("c5d5e3"), day_amount)
		environment.background_color = Color("080d1d").lerp(Color("7598b3"), day_amount)
		if procedural_sky:
			var night_top := Color("020610")
			var day_top := Color("4f83ad")
			var night_horizon := Color("17243b")
			var day_horizon := Color("bfd3dd")
			var sunset_top := Color("49698a")
			var sunset_horizon := Color("f2a56f")
			var top_color := night_top.lerp(day_top, day_amount).lerp(sunset_top, dusk_amount * 0.58)
			var horizon_color := night_horizon.lerp(day_horizon, day_amount).lerp(sunset_horizon, dusk_amount * 0.92)
			procedural_sky.sky_top_color = top_color
			procedural_sky.sky_horizon_color = horizon_color
			procedural_sky.ground_horizon_color = horizon_color.darkened(0.12)
			procedural_sky.ground_bottom_color = Color("02040a").lerp(Color("253b46"), day_amount)
			procedural_sky.sky_curve = lerp(0.20, 0.08, day_amount)
			procedural_sky.ground_curve = 0.11
			procedural_sky.sky_energy_multiplier = lerp(0.22, 1.0, day_amount)
			procedural_sky.ground_energy_multiplier = lerp(0.12, 0.56, day_amount)
			procedural_sky.sun_energy_multiplier = lerp(0.03, 1.65, day_amount) + dusk_amount * 0.35

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
