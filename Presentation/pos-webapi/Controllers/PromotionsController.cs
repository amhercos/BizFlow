using Application.Features.Promotions.Commands;
using Application.Features.Promotions.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "StoreOwner")]
public class PromotionsController : ControllerBase
{
    private readonly IMediator _mediator;
    public PromotionsController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
        => Ok(await _mediator.Send(new GetPromotionsQuery(), ct));

    [HttpPost("calculate")]
    public async Task<IActionResult> CalculatePrice([FromBody] GetCalculatedPriceQuery query, CancellationToken ct)
     => Ok(await _mediator.Send(query, ct));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePromotionCommand command, CancellationToken ct)
    {
        await _mediator.Send(command, ct);
        return Ok();
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdatePromotionCommand command, CancellationToken ct)
    {
        if (id != command.MainProductId) return BadRequest("Product ID mismatch");

        await _mediator.Send(command, ct);
        return Ok();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
        => Ok(await _mediator.Send(new DeletePromotionCommand(id), ct));

    [HttpPatch("{id}/toggle")]
    public async Task<IActionResult> Toggle(Guid id, CancellationToken ct)
        => Ok(await _mediator.Send(new TogglePromotionCommand(id), ct));
}