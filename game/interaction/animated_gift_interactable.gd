class_name AnimatedGiftInteractable
extends GiftInteractable

@export_enum("reveal", "lantern") var animation_mode := "reveal"
@export var visual_root: Node3D
@export var lid_node_name := "FlowerLid"
@export var reveal_node_name := "CoinReveal"
@export var snow_node_name := "SnowCluster"
@export var scene_node_name := "LanternScene"

var _opened := false
var _snow: Node3D
var _light: OmniLight3D


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
	persist({"playing": _opened})


func _process(delta: float) -> void:
	if animation_mode != "lantern" or not _opened or not _snow:
		return
	_snow.rotation.y += delta * 0.72
	_snow.position.y = sin(Time.get_ticks_msec() * 0.0023) * 0.035
