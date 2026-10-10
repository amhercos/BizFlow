using System;

namespace Application.Features.Auth.Commands;

/// <summary>
/// A registration problem the user can fix (duplicate email, taken business name, weak password).
/// The API turns it into a 400 with a readable message instead of a generic 500.
/// </summary>
public class RegistrationException : Exception
{
    public string? Field { get; }

    public RegistrationException(string message, string? field = null) : base(message)
    {
        Field = field;
    }
}