arrival_rate = 8.0   # requests per second
service_rate = 10.0  # requests per second

utilisation = arrival_rate / service_rate
mean_time_in_system = 1 / (service_rate - arrival_rate)
mean_jobs_in_system = arrival_rate * mean_time_in_system  # Little's Law

print(round(utilisation, 2), round(mean_time_in_system, 2), round(mean_jobs_in_system, 1))