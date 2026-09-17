namespace NhaTre.Domain.Entities;

public class QuickHealthStatus
{
    public Guid Id { get; set; }
    public Guid ChildId { get; set; }
    public Guid RecordedByTeacherId { get; set; }
    public DateTime RecordedAt { get; set; }

    // D39 mục 1: 3 trường của bản ghi "sức khỏe nhanh".
    // Mood nhận đúng 4 giá trị trong NhaTre.Domain.Constants.HealthMoods.
    public string Mood { get; set; } = null!;
    public decimal? TemperatureCelsius { get; set; }
    public string Notes { get; set; } = null!;

    public Child Child { get; set; } = null!;
    public Teacher RecordedByTeacher { get; set; } = null!;
}