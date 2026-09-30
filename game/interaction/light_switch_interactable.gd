class_name LightSwitchInteractable
extends Interactable

@export var target_lights: Array[Light3D] = []
@export var emissive_meshes: Array[MeshInstance3D] = []
@export var starts_on := true
@export var transition_seconds := 0.3
@export var emissive_energy_on := 3.0

var _is_on := true
var _base_energy: Dictionary = {}


func _ready() -> void:
	super._ready()
	add_to_group("home_light_switch")
	for light in target_lights:
		if light:
			_base_energy[light] = light.light_energy
	_is_on = bool(AppState.get_interaction_state(object_id, starts_on))
	_apply_state(true)


func register_light(light: Light3D) -> void:
	if not light or target_lights.has(light):
		return
	target_lights.append(light)
	_base_energy[light] = light.light_energy
	if not _is_on:
		light.light_energy = 0.0


func get_prompt() -> String:
	return "Turn lights off" if _is_on else "Turn lights on"


func interact(_actor: Node3D) -> void:
	set_on(not _is_on)


func set_on(value: bool, immediate := false) -> bool:
	if value == _is_on:
		return true
	_is_on = value
	_apply_state(immediate)
	persist(_is_on)
	return true


func is_on() -> bool:
	return _is_on


func _apply_state(immediate: bool) -> void:
	for light in target_lights:
		if not light:
			continue
		var target: float = float(_base_energy.get(light, 1.0)) if _is_on else 0.0
		if immediate:
			light.light_energy = target
		else:
			create_tween().set_trans(Tween.TRANS_SINE).tween_property(light, "light_energy", target, transition_seconds)
	for mesh in emissive_meshes:
		if not mesh:
			continue
		var material := mesh.get_active_material(0)
		if material is StandardMaterial3D:
			material.emission_enabled = true
			material.emission_energy_multiplier = emissive_energy_on if _is_on else 0.0
