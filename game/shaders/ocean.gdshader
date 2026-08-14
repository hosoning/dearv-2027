shader_type spatial;
render_mode blend_mix, depth_draw_opaque, cull_back, diffuse_burley, specular_schlick_ggx;

uniform vec3 deep_color : source_color = vec3(0.015, 0.10, 0.17);
uniform vec3 shallow_color : source_color = vec3(0.05, 0.36, 0.44);
uniform vec3 foam_color : source_color = vec3(0.72, 0.93, 0.95);
uniform float wave_height : hint_range(0.0, 2.0) = 0.38;
uniform float wave_scale : hint_range(0.05, 2.0) = 0.24;
uniform float wave_speed : hint_range(0.0, 3.0) = 0.55;
uniform float roughness_value : hint_range(0.0, 1.0) = 0.16;

varying float wave;

float wave_field(vec2 p, float t) {
	float a = sin(dot(p, normalize(vec2(1.0, 0.22))) * 1.7 + t);
	float b = sin(dot(p, normalize(vec2(-0.35, 1.0))) * 2.35 + t * 1.34) * 0.54;
	float c = sin(dot(p, normalize(vec2(0.7, 0.8))) * 4.1 - t * 0.72) * 0.22;
	return (a + b + c) / 1.76;
}

void vertex() {
	vec2 p = VERTEX.xz * wave_scale;
	wave = wave_field(p, TIME * wave_speed);
	VERTEX.y += wave * wave_height;
	float eps = 0.08;
	float wx = wave_field(p + vec2(eps, 0.0), TIME * wave_speed);
	float wz = wave_field(p + vec2(0.0, eps), TIME * wave_speed);
	NORMAL = normalize(vec3((wave - wx) * 2.8, eps, (wave - wz) * 2.8));
}

void fragment() {
	float crest = smoothstep(0.52, 0.95, wave);
	ALBEDO = mix(deep_color, shallow_color, clamp(NORMAL.y, 0.0, 1.0));
	ALBEDO = mix(ALBEDO, foam_color, crest * 0.22);
	ROUGHNESS = roughness_value + crest * 0.08;
	METALLIC = 0.0;
	SPECULAR = 0.9;
}
