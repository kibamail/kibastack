local tsa = require"tsa"
local kumo = require"kumo"

kumo.on("tsa_init", function()
  tsa.start_http_listener{
    listen = "0.0.0.0:8008",
    trusted_hosts = { "0.0.0.0/0" },
  }
end)

local cached_load_shaping_data = kumo.memoize(kumo.shaping.load, {
  name = "tsa_load_shaping_data",
  ttl = "5 minutes",
  capacity = 4,
})

kumo.on("tsa_load_shaping_data", function()
  local shaping =
    cached_load_shaping_data{
      "/opt/kumomta/etc/policy/extras/shaping.toml",
    }

  return shaping
end)
