using System;
using System.Collections.Generic;
using System.Text;

namespace CollabSphere.Shared.Contracts;

public interface IMediaProcessingEvent
{
    Guid FileId { get; }
    string RawUrl { get; }    
    string ProcessType { get; } 
}
