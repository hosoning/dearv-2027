class_name FaucetInteractable
extends Interactable

@export var water_stream: Node3D
@export var splash_particles: GPUParticles3D
@export var water_audio: AudioStreamPlayer3D
@export var starts_on := false

var _is_on := false


func _ready() -> void:
	super._ready()
	_is_on = bool(AppState.get_interaction_state(object_id, starts_on))
	_apply_state()


func get_prompt() -> String:
	return "Turn water off" if _is_on else "Turn water on"


func interact(_actor: Node3D) -> void:
	_is_on = not _is_on
	_apply_state()
	persist(_is_on)


func _apply_state() -> void:
	if water_stream:
		water_stream.visible = _is_on
	if splash_particles:
		splash_particles.emitting = _is_on
	if water_audio:
		if _is_on and not water_audio.playing:
			water_audio.play()
		elif not _is_on:
			water_audio.stop()
