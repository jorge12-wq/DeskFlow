using DeskFlow.Core.DTOs.Tickets;
using DeskFlow.Core.Entities;

namespace DeskFlow.Core.Interfaces.Repositories;

public interface ITicketRepository
{
    Task<Ticket?> GetByIdAsync(Guid id);
    Task<Ticket?> GetByNumeroAsync(string numero);
    Task<(IEnumerable<Ticket> Items, int Total)> GetPagedAsync(TicketFilterDto filter);
    Task<Ticket> CreateAsync(Ticket ticket);
    Task UpdateAsync(Ticket ticket);
    Task<string> GenerateNumeroAsync(Guid tenantId);
    Task<Dictionary<string, int>> GetCountsByEstadoAsync();
    Task<Dictionary<string, int>> GetCountsByPrioridadAsync();
    Task<int> GetTicketsVencidosSLAAsync();
}
