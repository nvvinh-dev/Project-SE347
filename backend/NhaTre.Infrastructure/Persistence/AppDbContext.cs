using Microsoft.EntityFrameworkCore;
using NhaTre.Domain.Entities;

namespace NhaTre.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Role> Roles => Set<Role>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Teacher> Teachers => Set<Teacher>();
    public DbSet<Child> Children => Set<Child>();
    public DbSet<ChildGuardian> ChildGuardians => Set<ChildGuardian>();
    public DbSet<Class> Classes => Set<Class>();
    public DbSet<Attendance> Attendances => Set<Attendance>();
    public DbSet<Pickup> Pickups => Set<Pickup>();
    public DbSet<RegisteredPickupPerson> RegisteredPickupPersons => Set<RegisteredPickupPerson>();
    public DbSet<QuickHealthStatus> QuickHealthStatuses => Set<QuickHealthStatus>();
    public DbSet<GrowthMeasurement> GrowthMeasurements => Set<GrowthMeasurement>();
    public DbSet<Incident> Incidents => Set<Incident>();
    public DbSet<IncidentPhoto> IncidentPhotos => Set<IncidentPhoto>();
    public DbSet<ActivityPhoto> ActivityPhotos => Set<ActivityPhoto>();
    public DbSet<TuitionFee> TuitionFees => Set<TuitionFee>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<WeeklyMenu> WeeklyMenus => Set<WeeklyMenu>();
    public DbSet<MenuEntry> MenuEntries => Set<MenuEntry>();
    public DbSet<Notification> Notifications => Set<Notification>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}