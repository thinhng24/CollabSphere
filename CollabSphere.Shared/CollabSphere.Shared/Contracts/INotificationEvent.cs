using System;
using System.Collections.Generic;
using System.Text;

namespace CollabSphere.Shared.Contracts;

public interface INotificationEvent
{
    string ReceiverId { get; }
    string Title { get; }
    string Content { get; }
    string Type { get; } 
}
