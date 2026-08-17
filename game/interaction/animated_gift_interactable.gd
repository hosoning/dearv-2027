class_name AnimatedGiftInteractable
extends GiftInteractable

@export_enum("reveal", "lantern") var animation_mode := "reveal"
@export var visual_root: Node3D
@export var lid_node_name := "FlowerLid"
@export var reveal_node_name := "CoinReveal"
@export var snow_node_name := "SnowCluster"
@export var scene_node_name := "LanternScene"

const CHIME_SAMPLE_RATE := 22050.0
const CHIME_BEAT_SECONDS := 0.58
# A small original music-box motif rather than a copyrighted Christmas carol.
const CHIME_NOTES := [659.255, 783.991, 880.0, 698.456, 783.991, 587.330, 659.255, 523.251]

var _opened := false
var _snow: Node3D
var _light: OmniLight3D
var _music_player: AudioStreamPlayer
var _music_playback: AudioStreamGeneratorPlayback
var _music_sample_index := 0


func _ready() -> void:
	super._ready()
	call_deferred("_bind_visual_nodes")
	set_process(animation_mode == "lantern")


func _bind_visual_nodes() -> void:
	if not visual_root:
		return
	if animation_mode == "reveal":
		var reveal := visual_root.find_child(reveal_node_name, true, false) as Node3D
		if reveal:
			reveal.visible = false
	elif animation_mode == "lantern":
		_snow = visual_root.find_child(snow_node_name, true, false) as Node3D
		_light = OmniLight3D.new()
		_light.name = "WarmLanternGlow"
		_light.light_color = Color("ffd08a")
		_light.light_energy = 0.0
		_light.omni_range = 4.0
		_light.position = Vector3(0.0, 1.1, 0.0)
		visual_root.add_child(_light)
		_setup_music_box()


func _setup_music_box() -> void:
	_music_player = AudioStreamPlayer.new()
	_music_player.name = "MusicBoxChime"
	var generator := AudioStreamGenerator.new()
	generator.mix_rate = CHIME_SAMPLE_RATE
	generator.buffer_length = 0.42
	_music_player.stream = generator
	_music_player.volume_db = -18.0
	add_child(_music_player)


func interact(actor: Node3D) -> void:
	if animation_mode == "reveal":
		_toggle_520_reveal()
	else:
		_toggle_lantern()
	super.interact(actor)


func _toggle_520_reveal() -> void:
	if not visual_root:
		return
	_opened = not _opened
	var lid := visual_root.find_child(lid_node_name, true, false) as Node3D
	var reveal := visual_root.find_child(reveal_node_name, true, false) as Node3D
	if reveal:
		reveal.visible = _opened
	if lid:
		var tween := create_tween().set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN_OUT)
		var target_position := Vector3(-0.72, 0.42, -0.18) if _opened else Vector3.ZERO
		var target_rotation := Vector3(0.0, 0.0, deg_to_rad(-16.0)) if _opened else Vector3.ZERO
		tween.parallel().tween_property(lid, "position", target_position, 0.55)
		tween.parallel().tween_property(lid, "rotation", target_rotation, 0.55)
	persist({"opened": _opened})


func _toggle_lantern() -> void:
	_opened = not _opened
	if _light:
		var tween := create_tween().set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
		tween.tween_property(_light, "light_energy", 2.2 if _opened else 0.0, 0.45)
	if _music_player:
		if _opened:
			_music_sample_index = 0
			_music_player.play()
			_music_playback = _music_player.get_stream_playback() as AudioStreamGeneratorPlayback
			_fill_music_buffer()
		else:
			_music_player.stop()
			_music_playback = null
	persist({"playing": _opened})


func _process(delta: float) -> void:
	if animation_mode != "lantern" or not _opened:
		return
	if _snow:
		_snow.rotation.y += delta * 0.72
		_snow.position.y = sin(Time.get_ticks_msec() * 0.0023) * 0.035
	_fill_music_buffer()


func _fill_music_buffer() -> void:
	if not _music_playback:
		return
	var available := _music_playback.get_frames_available()
	for _frame in range(available):
		var time_seconds := float(_music_sample_index) / CHIME_SAMPLE_RATE
		var beat_position := time_seconds / CHIME_BEAT_SECONDS
		var note_index := int(floor(beat_position)) % CHIME_NOTES.size()
		var local_time := fmod(time_seconds, CHIME_BEAT_SECONDS)
		var frequency: float = CHIME_NOTES[note_index]
		# Fast attack, bell-like decay and a very quiet octave harmonic.
		var attack := clamp(local_time / 0.018, 0.0, 1.0)
		var envelope := attack * exp(-local_time * 5.3)
		var phase := TAU * frequency * time_seconds
		var sample := (sin(phase) * 0.72 + sin(phase * 2.0) * 0.20 + sin(phase * 3.01) * 0.08) * envelope * 0.22
		_music_playback.push_frame(Vector2(sample, sample))
		_music_sample_index += 1
