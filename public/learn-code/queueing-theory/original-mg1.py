arrival_rate = 8.0
mean_service_time = 0.1
service_time_std = 0.05
utilisation = arrival_rate * mean_service_time
second_moment = mean_service_time**2 + service_time_std**2

mean_queue_wait = arrival_rate * second_moment / (2 * (1 - utilisation))
mean_total_time = mean_service_time + mean_queue_wait
print(round(mean_queue_wait, 2), round(mean_total_time, 2))