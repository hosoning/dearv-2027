class_name CompanionSlot
extends Node3D

@export var model_path := "res://assets/models/companion_rig.glb"
@export var idle_animation := "Idle"
@export var placement := Vector3(2.7, 0.0, 2.2)
@export var rotation_y_degrees := 205.0

var companion: Node3D


func _ready() -> void:
	if not ResourceLoader.exists(model_path):
		# Deliberately render nobody rather than a primitive placeholder.
		return
	var packed := ResourceLoader.load(model_path) as PackedScene
	if not packed:
		push_warning("Companion asset could not be loaded as a scene: %s" % model_path)
		return
	var candidate := packed.instantiate() as Node3D
	if not candidate:
		return
	if not _contains_skeleton(candidate):
		push_warning("Companion asset rejected: a Skeleton3D/skinned rig is required.")
		candidate.queue_free()
		return
	candidate.name = "RiggedCompanion"
	candidate.position = placement
	candidate.rotation_degrees.y = rotation_y_degrees
	add_child(candidate)
	companion = candidate
	_play_idle(candidate)


func _contains_skeleton(node: Node) -> bool:
	if node is Skeleton3D:
		return true
	for child in node.get_children():
		if _contains_skeleton(child):
			return true
	return false


func _play_idle(node: Node) -> void:
	var player := _find_animation_player(node)
	if not player:
		return
	if player.has_animation(idle_animation):
		player.play(idle_animation)
	elif player.get_animation_list().size() > 0:
		player.play(player.get_animation_list()[0])


func _find_animation_player(node: Node) -> AnimationPlayer:
	if node is AnimationPlayer:
		return node as AnimationPlayer
	for child in node.get_children():
		var found := _find_animation_player(child)
		if found:
			return found
	return null
