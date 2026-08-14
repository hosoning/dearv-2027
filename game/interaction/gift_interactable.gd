class_name GiftInteractable
extends Interactable

@export var gift_id := ""
@export var display_name := "Keepsake"
@export_multiline var story := ""
@export var pages: Array[String] = []
@export var inspect_scene: PackedScene
@export var hero_image: Texture2D


func _ready() -> void:
	super._ready()
	prompt = "Examine %s" % display_name
	if gift_id.is_empty():
		gift_id = object_id


func interact(_actor: Node3D) -> void:
	AppState.open_inspector({
		"kind": "gift",
		"id": gift_id,
		"title": display_name,
		"story": story,
		"pages": pages,
		"scene": inspect_scene,
		"image": hero_image,
	})
