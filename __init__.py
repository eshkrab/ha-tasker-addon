"""Init file for the Tasker integration."""
from __future__ import annotations

import logging

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .const import DOMAIN, PLATFORMS

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up Tasker from a config entry."""
    if DOMAIN not in hass.data:
        hass.data[DOMAIN] = {}

    # Store a placeholder for this entry's data
    hass.data[DOMAIN][entry.entry_id] = {
        "entities": {}
    }

    # Forward the entry to our sensor platform
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    # Register services (optional but recommended) after sensor platform is set
    await _async_register_services(hass, entry)

    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    unload_ok = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if unload_ok:
        hass.data[DOMAIN].pop(entry.entry_id, None)
    return unload_ok


async def _async_register_services(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Register Tasker services such as `mark_done`."""
    domain_registered = hass.services.has_service(DOMAIN, "mark_done")
    if domain_registered:
        # Services already registered once, skip
        return

    async def async_mark_done(service_call):
        entity_ids = service_call.data.get("entity_id")
        if not entity_ids:
            return

        for eid in entity_ids:
            # Find the entity object from any loaded entry
            for entry_id, data in hass.data[DOMAIN].items():
                entity = data["entities"].get(eid)
                if entity:
                    entity.mark_done()

    hass.services.async_register(
        DOMAIN,
        "mark_done",
        async_mark_done,
    )

