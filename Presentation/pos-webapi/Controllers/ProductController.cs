using Application.Dto;
using Application.Features.Products.Commands;
using Application.Features.Products.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace pos_webapi.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class ProductController(IMediator mediator) : ControllerBase
    {
        [Authorize (Roles = "StoreOwner" )]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateProductCommand command)
        {
            var result = await mediator.Send(command);
            return Ok(result);
        }

        [HttpGet]
        [Authorize(Roles = "StoreOwner,Cashier")]
        public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var result = await mediator.Send(new GetProductQuery(page, pageSize));
            return Ok(result);
        }


        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var product = await mediator.Send(new GetProductByIdQuery(id));

            if (product == null) return NotFound();

            return Ok(product);
        }

       
        [HttpDelete("{id}")]
        [Authorize(Roles = "StoreOwner")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var result = await mediator.Send(new DeleteProductCommand(id));

            if (!result) return NotFound();

            return NoContent();
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ProductDto>> Update(Guid id, [FromBody] UpdateProductCommand command)
        {
            var commandWithId = command with { Id = id };

            var result = await mediator.Send(commandWithId);
            return Ok(result);
        }

        [HttpGet("near-expiry")]
        public async Task<IActionResult> GetNearExpiry()
        {
            var storeIdClaim = User.FindFirst("StoreId")?.Value;
            if (!Guid.TryParse(storeIdClaim, out var storeId)) return Unauthorized();
            var result = await mediator.Send(new GetNearExpiryProductsQuery(storeId));

            return Ok(result);
        }
    }
}
