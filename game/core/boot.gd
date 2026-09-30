extends Node

@onready var player: ComfortController = $Player
@onready var hud: DearVHud = $HUD


func _ready() -> void:
	# Later this boot scene chooses authenticated home, offline cache, or login.
	# The vertical slice is kept as a separate scene so visual production can
	# advance without touching the persistence and account layer.
	hud.bind_player(player)
