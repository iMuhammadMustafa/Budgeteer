CREATE OR REPLACE FUNCTION uuid_generate_v7()
RETURNS UUID AS $$
DECLARE
    ts_millis BIGINT;
    ts_bytes BYTEA;
    rand_bytes BYTEA;
    uuid_bytes BYTEA;
BEGIN
    -- Get current timestamp in milliseconds
    ts_millis := (extract(epoch FROM clock_timestamp()) * 1000)::BIGINT;

    -- Convert timestamp to bytea (first 6 bytes)
    ts_bytes := set_byte(set_byte(set_byte(set_byte(set_byte(set_byte(
        '\x000000000000'::BYTEA, 0, ((ts_millis >> 40) & 255)::INTEGER),
        1, ((ts_millis >> 32) & 255)::INTEGER),
        2, ((ts_millis >> 24) & 255)::INTEGER),
        3, ((ts_millis >> 16) & 255)::INTEGER),
        4, ((ts_millis >> 8) & 255)::INTEGER),
        5, (ts_millis & 255)::INTEGER);

    -- Generate 10 random bytes for entropy
    rand_bytes := gen_random_bytes(10);

    -- Combine timestamp and random bytes
    uuid_bytes := ts_bytes || rand_bytes;

    -- Set UUID version to 7 (bitwise OR with 112 instead of 0x70)
    uuid_bytes := set_byte(uuid_bytes, 6, (get_byte(uuid_bytes, 6) & 15) | 112);

    -- Set variant to RFC 4122 (bitwise OR with 128 instead of 0x80)
    uuid_bytes := set_byte(uuid_bytes, 8, (get_byte(uuid_bytes, 8) & 63) | 128);

    -- Return the final UUID
    RETURN encode(uuid_bytes, 'hex')::UUID;
END;
$$ LANGUAGE plpgsql;
