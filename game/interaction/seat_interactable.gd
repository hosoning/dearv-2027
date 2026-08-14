class_name SeatInteractable
extends Interactable

@export var seat_anchor: Node3D
@export var display_name := "sofa"


func _ready() -> void:
	super._ready()
	prompt = "Sit on %s" % display_name


func can_interact(actor: Node3D) -> bool:
	return seat_anchor != null and actor is ComfortController


func interact(actor: Node3D) -> void:
	if actor is ComfortController and seat_anchor:
		(actor as ComfortController).enter_comfort_pose(seat_anchor)
