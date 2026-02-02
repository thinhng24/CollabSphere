using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddCheckpointStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Feedback",
                table: "Checkpoints",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<double>(
                name: "Score",
                table: "Checkpoints",
                type: "double",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Checkpoints",
                type: "longtext",
                nullable: false)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Feedback",
                table: "Checkpoints");

            migrationBuilder.DropColumn(
                name: "Score",
                table: "Checkpoints");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Checkpoints");
        }
    }
}
