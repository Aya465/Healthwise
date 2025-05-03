import os
from transformers import (
    T5ForConditionalGeneration,
    T5Tokenizer,
    Seq2SeqTrainingArguments,
    Seq2SeqTrainer
)
from datasets import Dataset
import pandas as pd

# 1. Suppress warnings
os.environ['HF_HUB_DISABLE_SYMLINKS_WARNING'] = '1'


# 2. Load and combine datasets
def load_and_combine_datasets():
    # Load diet dataset
    diet_df = pd.read_excel(r"C:\Users\HP\Desktop\healthwise_data\dietary_suggestions\t5_diet_train.xlsx")

    # Load symptom dataset
    symptoms_df = pd.read_excel(r"C:\Users\HP\Desktop\healthwise_data\symptom_tracking\t5_symptom_train.xlsx")

    # Verify columns
    assert all(col in diet_df.columns for col in ['input', 'output']), "Diet dataset missing required columns"
    assert all(col in symptoms_df.columns for col in ['input', 'output']), "Symptom dataset missing required columns"

    # Combine datasets
    combined_df = pd.concat([diet_df, symptoms_df], ignore_index=True)

    # Shuffle the dataset
    return combined_df.sample(frac=1).reset_index(drop=True)


# Load the data
try:
    df = load_and_combine_datasets()
    print(f"Successfully loaded dataset with {len(df)} samples")
    print(df.head())  # Verify the data looks correct

    dataset = Dataset.from_pandas(df)
except Exception as e:
    print(f"Error loading datasets: {e}")
    raise

# 3. Initialize tokenizer and tokenize data
tokenizer = T5Tokenizer.from_pretrained("t5-small", legacy=False)  # Added legacy=False to avoid warning


def tokenize_function(examples):
    return tokenizer(
        text=examples["input"],
        text_target=examples["output"],
        max_length=128,
        truncation=True,
        padding="max_length",
        return_tensors="pt"
    )


tokenized_dataset = dataset.map(tokenize_function, batched=True)

# 4. Initialize model
model = T5ForConditionalGeneration.from_pretrained("t5-small")

# 5. Set up training arguments (without evaluation since no eval dataset provided)
training_args = Seq2SeqTrainingArguments(
    output_dir=r"G:\Healthwise_2\t5_fine_tuned",
    per_device_train_batch_size=8,
    num_train_epochs=3,
    save_steps=500,
    save_total_limit=2,  # Only keep last 2 checkpoints
    logging_steps=100,
    learning_rate=3e-4,
    predict_with_generate=True,
    fp16=False,  # Set to True if using GPU with CUDA
    evaluation_strategy="no",  # Disabled evaluation
    load_best_model_at_end=False,  # Disabled without evaluation
    report_to="none"  # Disables wandb/mlflow if not needed
)

# 6. Create Trainer
trainer = Seq2SeqTrainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_dataset,
    tokenizer=tokenizer
)

# 7. Start training
print("Starting training...")
trainer.train()
print("Training complete!")

# Save the trained model and tokenizer
output_dir = r"G:\Healthwise_2\t5_fine_tuned_model"
model.save_pretrained(output_dir)
tokenizer.save_pretrained(output_dir)
print(f"Model saved to {output_dir}")