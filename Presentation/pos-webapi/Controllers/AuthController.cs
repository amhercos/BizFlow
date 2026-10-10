using Application.Features.Auth.Commands;
using Application.Features.Auth.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace pos_webapi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController (IMediator mediator) : ControllerBase
    {

        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> GetCurrentUser()
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var storeId = User.FindFirst("StoreId")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            var result = await mediator.Send(new GetCurrentUserQuery(userId));
            return Ok(result);
        }


        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginUserCommand command)
        {
            var result = await mediator.Send(command);
            return Ok(result);
        }


        [HttpPost("register-storeowner")]
        public async Task<IActionResult> RegisterMerchant([FromBody] RegisterStoreOwnerCommand command)
        {
            try
            {
                var result = await mediator.Send(command);

                if (result)
                {
                    return Ok(new { message = "Store and Owner registered successfully." });
                }

                return BadRequest(new { message = "Registration failed." });
            }
            catch (RegistrationException ex)
            {
                return BadRequest(new { message = ex.Message, field = ex.Field });
            }
        }


        [Authorize(Roles = "StoreOwner")]
        [HttpPost("add-staff")]
        public async Task<IActionResult> AddStaff([FromBody] AddStaffCommand command)
        {
            var result = await mediator.Send(command);
            if (result) return Ok(new { message = "Staff added successfully." });

            return BadRequest("Could not add staff.");
        }
    }


}
