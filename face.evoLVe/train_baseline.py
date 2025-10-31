import torch
import torchvision
import torchvision.transforms as transforms
import torchvision.datasets as datasets
import torch.nn as nn
import torch.optim as optim

# 1. Setup and Data Preparation

# Set device
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

BATCH_SIZE = 64

# Define transformations for your dataset (e.g., ImageNet)
# Adjust these based on your specific dataset and needs
transform_train = transforms.Compose([
    transforms.RandomResizedCrop(224),
    transforms.RandomHorizontalFlip(),
    transforms.RandomRotation(30),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

transform_val = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

trainset = datasets.ImageFolder(root='/media/khainq/Data/DeepFashion52K/train', transform=transform_train)
trainloader = torch.utils.data.DataLoader(trainset, batch_size=BATCH_SIZE, shuffle=True, num_workers=4)

valset = datasets.ImageFolder(root='/media/khainq/Data/DeepFashion52K/val', transform=transform_val)
valloader = torch.utils.data.DataLoader(valset, batch_size=BATCH_SIZE, shuffle=False, num_workers=4)

num_classes = 7991

# 2. Model Loading and Modification
# Load pre-trained ResNet-50 model
model = torchvision.models.resnet50(weights=torchvision.models.ResNet50_Weights.DEFAULT)

# Modify the final fully connected layer for your specific number of classes
num_ftrs = model.fc.in_features
model.fc = nn.Linear(num_ftrs, num_classes)

# Creaste a feature extractor to extract features before the final layer, to calculate feature embeddings cosine similarity if needed
feature_extractor = nn.Sequential(*list(model.children())[:-1])  # Remove the final classification layer


# Move model to device
model = model.to(device)

# 3. Loss Function and Optimizer
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=0.01) # Or use SGD with momentum
step_LR = optim.lr_scheduler.StepLR(optimizer, step_size=20, gamma=0.1)

log_file = open('weights/r50_e80_bs64_lr0.01_step20_+rotation.log', 'w')

# 4. Training Loop
num_epochs = 80 # Adjust as needed

for epoch in range(num_epochs):
    # Training phase
    model.train()
    running_loss = 0.0
    correct_predictions = 0
    total_samples = 0

    for i, (inputs, labels) in enumerate(trainloader):
        inputs, labels = inputs.to(device), labels.to(device)

        optimizer.zero_grad()
        outputs = model(inputs)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()

        running_loss += loss.item() * inputs.size(0)
        _, predicted = torch.max(outputs.data, 1)
        total_samples += labels.size(0)
        correct_predictions += (predicted == labels).sum().item()

    step_LR.step()

    epoch_loss = running_loss / total_samples
    epoch_acc = correct_predictions / total_samples
    print(f"Epoch {epoch+1}/{num_epochs} - Train Loss: {epoch_loss:.4f}, Train Acc: {epoch_acc:.4f}, LR: {step_LR.get_last_lr()[0]:.4f}")
    log_file.write(f"Epoch {epoch+1}/{num_epochs} - Train Loss: {epoch_loss:.4f}, Train Acc: {epoch_acc:.4f}, LR: {step_LR.get_last_lr()[0]:.4f}\n")

    # Validation phase
    model.eval()
    val_loss = 0.0
    val_correct_predictions = 0
    val_total_samples = 0

    with torch.no_grad():
        for inputs, labels in valloader:
            inputs, labels = inputs.to(device), labels.to(device)
            outputs = model(inputs)
            loss = criterion(outputs, labels)

            val_loss += loss.item() * inputs.size(0)
            _, predicted = torch.max(outputs.data, 1)
            val_total_samples += labels.size(0)
            val_correct_predictions += (predicted == labels).sum().item()

    val_epoch_loss = val_loss / val_total_samples
    val_epoch_acc = val_correct_predictions / val_total_samples
    print(f"Epoch {epoch+1}/{num_epochs} - Val Loss: {val_epoch_loss:.4f}, Val Acc: {val_epoch_acc:.4f}")
    log_file.write(f"Epoch {epoch+1}/{num_epochs} - Val Loss: {val_epoch_loss:.4f}, Val Acc: {val_epoch_acc:.4f}\n")

    # Save model checkpoint when epoch % 10 == 9
    if (epoch + 1) % 10 == 0:
        torch.save(model.state_dict(), f'weights/resnet50_e{epoch+1}.pth')

print("Training complete!")
log_file.close()