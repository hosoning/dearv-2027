class_name Interactable
extends Area3D

signal state_changed(value: Variant)

@export var object_id := ""
@export var prompt := "Interact"
@export var interaction_distance := 2.4
@export_multiline var accessible_description := ""


func _ready() -> void:
	add_to_group("interactable")
	collision_layer = 2
	collision_mask = 0
	if object_id.is_empty():
		object_id = String(name).to_snake_case()


func can_interact(_actor: Node3D) -> bool:
	return true


func get_prompt() -> String:
	return prompt


func interact(_actor: Node3D) -> void:
	push_warning("%s has no interaction implementation." % object_id)


func persist(value: Variant) -> void:
	AppState.set_interaction_state(object_id, value)
	state_changed.emit(value)
