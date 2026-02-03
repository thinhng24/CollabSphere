using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace CollabSphere.API.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Meetings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    StartTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TeamName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Participants = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Meetings", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "Meetings",
                columns: new[] { "Id", "Description", "EndTime", "IsActive", "Participants", "StartTime", "Status", "TeamName", "Title" },
                values: new object[,]
                {
                    { 1, "Daily standup meeting", new DateTime(2026, 1, 22, 20, 37, 32, 833, DateTimeKind.Local).AddTicks(5496), true, "", new DateTime(2026, 1, 22, 19, 37, 32, 833, DateTimeKind.Local).AddTicks(5482), "Scheduled", "Development Team", "Team Standup" },
                    { 2, "Weekly project review", new DateTime(2026, 1, 22, 22, 37, 32, 833, DateTimeKind.Local).AddTicks(5499), true, "", new DateTime(2026, 1, 22, 21, 37, 32, 833, DateTimeKind.Local).AddTicks(5499), "Scheduled", "Project Management", "Project Review" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Meetings");
        }
    }
}
