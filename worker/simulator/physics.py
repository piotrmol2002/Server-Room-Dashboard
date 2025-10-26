import math
import random
from datetime import datetime, timedelta


class ThermalModel:
    @staticmethod
    def calculate_target_temperature(
        cpu_load: float,
        idle_temp: float,
        max_temp: float,
        ambient_temp: float = 22.0
    ) -> float:
        load_factor = cpu_load / 100.0
        temp_range = max_temp - idle_temp
        return idle_temp + (temp_range * load_factor)

    @staticmethod
    def apply_cooling(
        current_temp: float,
        target_temp: float,
        cooling_rate: float,
        time_delta_seconds: float
    ) -> float:
        if current_temp <= target_temp:
            return current_temp

        temp_diff = current_temp - target_temp
        cooling_amount = temp_diff * cooling_rate * (time_delta_seconds / 60.0)
        new_temp = current_temp - cooling_amount

        return max(new_temp, target_temp)

    @staticmethod
    def apply_heating(
        current_temp: float,
        target_temp: float,
        heating_rate: float,
        time_delta_seconds: float
    ) -> float:
        if current_temp >= target_temp:
            return current_temp

        temp_diff = target_temp - current_temp
        heating_amount = temp_diff * heating_rate * (time_delta_seconds / 60.0)
        new_temp = current_temp + heating_amount

        return min(new_temp, target_temp)


class LoadSimulator:
    @staticmethod
    def generate_realistic_cpu(
        baseline: float,
        variance: float,
        time_of_day: datetime
    ) -> float:
        hour = time_of_day.hour
        day_factor = 1.0

        if 9 <= hour <= 17:
            day_factor = 1.2
        elif 0 <= hour <= 6:
            day_factor = 0.7

        noise = random.gauss(0, variance / 3)
        cpu = baseline * day_factor + noise

        return max(0.0, min(100.0, cpu))

    @staticmethod
    def generate_realistic_ram(
        baseline: float,
        variance: float,
        cpu_usage: float
    ) -> float:
        correlation = 0.3
        noise = random.gauss(0, variance / 3)
        ram = baseline + (cpu_usage - baseline) * correlation + noise

        return max(0.0, min(100.0, ram))

    @staticmethod
    def apply_stress_test(baseline: float, intensity: float) -> float:
        stress_load = 80 + (intensity * 15)
        return min(100.0, stress_load)

    @staticmethod
    def apply_idle_state(current_load: float, decay_rate: float = 0.1) -> float:
        return max(5.0, current_load * (1 - decay_rate))
