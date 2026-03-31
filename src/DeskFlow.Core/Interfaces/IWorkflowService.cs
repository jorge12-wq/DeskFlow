using DeskFlow.Core.DTOs.Workflows;

namespace DeskFlow.Core.Interfaces;

public interface IWorkflowService
{
    Task<List<WorkflowListItemDto>> GetAllAsync();
    Task<WorkflowDetalleDto?> GetByIdAsync(Guid id);
    Task<WorkflowDetalleDto> CreateAsync(CreateWorkflowDto dto);
    Task<WorkflowDetalleDto> SaveAsync(Guid id, SaveWorkflowDto dto);
    Task DeleteAsync(Guid id);
}
