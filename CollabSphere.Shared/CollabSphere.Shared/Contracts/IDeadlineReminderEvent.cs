using System;
using System.Collections.Generic;
using System.Text;

namespace CollabSphere.Shared.Contracts;

public interface IDeadlineReminderEvent
{
    Guid TargetId { get; }    // ID của Topic hoặc Bài tập
    string TargetName { get; }
    DateTime Deadline { get; }
    string StudentEmail { get; }
}
