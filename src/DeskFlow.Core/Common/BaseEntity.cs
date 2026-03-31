namespace DeskFlow.Core.Common;

public abstract class BaseEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
}

public abstract class TenantEntity : BaseEntity
{
    public Guid TenantId { get; set; }
}
