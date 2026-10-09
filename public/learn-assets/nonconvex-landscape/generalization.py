import numpy as np

def predict(parameter, inputs):
    return inputs + parameter*(inputs*inputs-1)

def half_mse(predictions, targets):
    return float(np.mean((predictions-targets)**2)/2)

train_x = np.array([-1.0,1.0])
train_y = train_x.copy()
test_x = np.array([0.0])
test_y = np.array([0.0])  # declared target rule y=x
for parameter in [-1.0,0.0,1.0,2.0]:
    train = half_mse(predict(parameter,train_x),train_y)
    test = half_mse(predict(parameter,test_x),test_y)
    print(f"a={parameter:+.0f}: training={train:.1f}, held-out={test:.1f}")
