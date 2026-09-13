namespace NhaTre.Domain.Entities;

public class GrowthMeasurement
{
    public Guid Id { get; set; }
    public Guid ChildId { get; set; }
    public Guid RecordedByUserId { get; set; }
    public DateTime MeasuredAt { get; set; }
    public decimal? HeightCm { get; set; }
    public decimal? WeightKg { get; set; } // check: ít nhất 1 trong 2 phải có giá trị — ràng buộc ở DB (3.2)

    public Child Child { get; set; } = null!;
    public User RecordedByUser { get; set; } = null!;
}