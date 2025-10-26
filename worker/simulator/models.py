from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional


@dataclass
class ServerState:
    server_id: int
    is_online: bool

    cpu_baseline: float = 30.0
    cpu_variance: float = 15.0
    cpu_current: float = 0.0

    ram_baseline: float = 40.0
    ram_variance: float = 10.0
    ram_current: float = 0.0

    temperature_current: float = 22.0
    temperature_idle: float = 22.0
    temperature_max: float = 75.0

    cooling_rate: float = 0.3
    heating_rate: float = 0.5

    uptime_seconds: int = 0
    last_update: datetime = field(default_factory=datetime.utcnow)

    def initialize_from_load(self, cpu: float, ram: float):
        target_temp = self.temperature_idle + (self.temperature_max - self.temperature_idle) * (cpu / 100.0)
        self.cpu_current = cpu
        self.ram_current = ram
        self.temperature_current = target_temp


@dataclass
class MetricsSnapshot:
    server_id: int
    timestamp: datetime
    cpu_usage: float
    ram_usage: float
    temperature: float
    uptime: int
    status: str

    def to_dict(self):
        return {
            'server_id': self.server_id,
            'timestamp': self.timestamp.isoformat(),
            'cpu_usage': round(self.cpu_usage, 2),
            'ram_usage': round(self.ram_usage, 2),
            'temperature': round(self.temperature, 2),
            'uptime': self.uptime,
            'status': self.status
        }


@dataclass
class SimulationEvent:
    event_type: str
    server_id: int
    params: dict = field(default_factory=dict)
    timestamp: datetime = field(default_factory=datetime.utcnow)
