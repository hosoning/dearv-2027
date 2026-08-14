extends Node

signal auth_completed(ok: bool, message: String)

const DEFAULT_URL := "https://qndiibbjadhgtapuonco.supabase.co"
const DEFAULT_PUBLISHABLE_KEY := "sb_publishable_-idhgIzi_uUs5cv68qp7wQ_W0PlamxT"

var base_url := ""
var publishable_key := ""


func _ready() -> void:
	base_url = OS.get_environment("DEARV_SUPABASE_URL")
	publishable_key = OS.get_environment("DEARV_SUPABASE_PUBLISHABLE_KEY")
	if base_url.is_empty():
		base_url = DEFAULT_URL
	if publishable_key.is_empty():
		publishable_key = DEFAULT_PUBLISHABLE_KEY


func sign_in(email: String, password: String) -> bool:
	var result := await _request_json(
		"/auth/v1/token?grant_type=password",
		HTTPClient.METHOD_POST,
		{"email": email, "password": password},
		false
	)
	if not result.ok:
		auth_completed.emit(false, result.message)
		return false
	AppState.set_session(result.data)
	auth_completed.emit(true, "")
	return true


func refresh_session() -> bool:
	if AppState.refresh_token.is_empty():
		return false
	var result := await _request_json(
		"/auth/v1/token?grant_type=refresh_token",
		HTTPClient.METHOD_POST,
		{"refresh_token": AppState.refresh_token},
		false
	)
	if not result.ok:
		return false
	AppState.set_session(result.data)
	return true


func select_rows(table: String, query := "") -> Dictionary:
	return await _request_json("/rest/v1/%s%s" % [table, query], HTTPClient.METHOD_GET, null, true)


func upsert_rows(table: String, payload: Variant, query := "") -> Dictionary:
	return await _request_json(
		"/rest/v1/%s%s" % [table, query],
		HTTPClient.METHOD_POST,
		payload,
		true,
		{"Prefer": "resolution=merge-duplicates,return=representation"}
	)


func _request_json(
	path: String,
	method: HTTPClient.Method,
	body: Variant = null,
	requires_auth := true,
	extra_headers: Dictionary = {}
) -> Dictionary:
	var request := HTTPRequest.new()
	add_child(request)
	var headers := PackedStringArray([
		"apikey: %s" % publishable_key,
		"Content-Type: application/json",
	])
	if requires_auth and not AppState.access_token.is_empty():
		headers.append("Authorization: Bearer %s" % AppState.access_token)
	for key in extra_headers:
		headers.append("%s: %s" % [key, extra_headers[key]])
	var body_text := "" if body == null else JSON.stringify(body)
	var start_error := request.request(base_url + path, headers, method, body_text)
	if start_error != OK:
		request.queue_free()
		return {"ok": false, "status": 0, "message": error_string(start_error), "data": {}}
	var response: Array = await request.request_completed
	request.queue_free()
	var status: int = response[1]
	var text := (response[3] as PackedByteArray).get_string_from_utf8()
	var parsed: Variant = JSON.parse_string(text)
	if parsed == null and not text.is_empty():
		parsed = {"raw": text}
	var ok := status >= 200 and status < 300
	var message := ""
	if not ok and parsed is Dictionary:
		message = str(parsed.get("msg", parsed.get("message", "Request failed")))
	return {"ok": ok, "status": status, "message": message, "data": parsed}
