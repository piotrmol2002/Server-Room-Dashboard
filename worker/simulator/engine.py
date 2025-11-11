from datetime import timedelta
from typing import Dict, List, Optional
from .models import ServerState, MetricsSnapshot, SimulationEvent
from .physics import ThermalModel, LoadSimulator
from core.timezone import now_warsaw
import random


class SimulationEngine:
    def __init__(self):
        self.server_states: Dict[int, ServerState] = {}
        self.pending_events: List[SimulationEvent] = []

    def register_server(
        self,
        server_id: int,
        is_online: bool,
        current_cpu: float = 0.0,
        current_ram: float = 0.0,
        current_temp: float = 22.0,
        uptime: int = 0
    ) -> ServerState:
        state = ServerState(
            server_id=server_id,
            is_online=is_online,
            cpu_current=current_cpu,
            ram_current=current_ram,
            temperature_current=current_temp,
            uptime_seconds=uptime,
            last_update=now_warsaw()
        )

        if is_online:
            state.cpu_baseline = 25.0 + random.uniform(0, 20)
            state.ram_baseline = 35.0 + random.uniform(0, 15)

        self.server_states[server_id] = state
        return state

    def simulate_tick(self, server_id: int, interval_seconds: int = 10) -> MetricsSnapshot:
        if server_id not in self.server_states:
            raise ValueError(f"Server {server_id} not registered")

        state = self.server_states[server_id]
        now = now_warsaw()
        time_delta = (now - state.last_update).total_seconds()

        self._process_pending_events(server_id, now)

        if state.is_online:
            state.cpu_current = LoadSimulator.generate_realistic_cpu(
                state.cpu_baseline,
                state.cpu_variance,
                now
            )

            state.ram_current = LoadSimulator.generate_realistic_ram(
                state.ram_baseline,
                state.ram_variance,
                state.cpu_current
            )

            target_temp = ThermalModel.calculate_target_temperature(
                state.cpu_current,
                state.temperature_idle,
                state.temperature_max
            )

            if state.temperature_current < target_temp:
                state.temperature_current = ThermalModel.apply_heating(
                    state.temperature_current,
                    target_temp,
                    state.heating_rate,
                    time_delta
                )
            else:
                state.temperature_current = ThermalModel.apply_cooling(
                    state.temperature_current,
                    target_temp,
                    state.cooling_rate,
                    time_delta
                )

            state.uptime_seconds += int(time_delta)
        else:
            state.cpu_current = 0.0
            state.ram_current = 0.0

            state.temperature_current = ThermalModel.apply_cooling(
                state.temperature_current,
                state.temperature_idle,
                state.cooling_rate,
                time_delta
            )

            state.uptime_seconds = 0

        state.last_update = now

        return MetricsSnapshot(
            server_id=server_id,
            timestamp=now,
            cpu_usage=state.cpu_current,
            ram_usage=state.ram_current,
            temperature=state.temperature_current,
            uptime=state.uptime_seconds,
            status='online' if state.is_online else 'offline'
        )

    def set_server_status(self, server_id: int, online: bool):
        if server_id in self.server_states:
            state = self.server_states[server_id]
            state.is_online = online

            if not online:
                state.uptime_seconds = 0

    def trigger_event(self, event: SimulationEvent):
        self.pending_events.append(event)

    def set_load_baseline(self, server_id: int, cpu_baseline: float, ram_baseline: float):
        if server_id in self.server_states:
            state = self.server_states[server_id]
            state.cpu_baseline = max(0.0, min(100.0, cpu_baseline))
            state.ram_baseline = max(0.0, min(100.0, ram_baseline))

    def trigger_stress_test(self, server_id: int, duration_seconds: int, intensity: float = 1.0):
        event = SimulationEvent(
            event_type='stress_test',
            server_id=server_id,
            params={
                'duration': duration_seconds,
                'intensity': intensity,
                'end_time': now_warsaw() + timedelta(seconds=duration_seconds)
            }
        )
        self.trigger_event(event)

    def _process_pending_events(self, server_id: int, current_time: datetime):
        active_events = [e for e in self.pending_events if e.server_id == server_id]

        for event in active_events:
            if event.event_type == 'stress_test':
                end_time = event.params.get('end_time')
                if current_time < end_time:
                    state = self.server_states[server_id]
                    intensity = event.params.get('intensity', 1.0)
                    state.cpu_current = LoadSimulator.apply_stress_test(
                        state.cpu_baseline,
                        intensity
                    )
                    state.ram_current = min(95.0, state.ram_baseline + 40 * intensity)
                else:
                    self.pending_events.remove(event)

    def get_state(self, server_id: int) -> Optional[ServerState]:
        return self.server_states.get(server_id)

    def get_all_states(self) -> Dict[int, ServerState]:
        return self.server_states
