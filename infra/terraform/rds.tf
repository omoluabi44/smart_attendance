# ============================================================================
# RDS Integration & VPC Peering to coursepass-db (vpc-0bb3779801c100c66)
# Reuses the existing active MySQL 8.0 RDS instance without exceeding AWS quotas
# ============================================================================

variable "coursepass_vpc_id" {
  description = "VPC ID where the existing coursepass-db instance is hosted"
  type        = string
  default     = "vpc-0bb3779801c100c66"
}

variable "coursepass_route_table_id" {
  description = "Route Table ID for the CoursePass VPC to route return traffic to FacePass"
  type        = string
  default     = "rtb-0f04589852d47741d"
}

variable "existing_rds_host" {
  description = "Hostname of the active RDS instance"
  type        = string
  default     = "coursepass-db.cozkwemkcreu.us-east-1.rds.amazonaws.com"
}

# 1. Establish VPC Peering between FacePass VPC (10.0.0.0/16) and CoursePass VPC (172.31.0.0/16)
resource "aws_vpc_peering_connection" "coursepass_peering" {
  peer_vpc_id = var.coursepass_vpc_id
  vpc_id      = aws_vpc.main.id
  auto_accept = true

  tags = {
    Name = "${var.project_name}-to-coursepass-peering"
  }
}

# 2. Add route in FacePass public route table to reach CoursePass VPC (172.31.0.0/16)
resource "aws_route" "facepass_to_coursepass" {
  route_table_id            = aws_route_table.public.id
  destination_cidr_block    = "172.31.0.0/16"
  vpc_peering_connection_id = aws_vpc_peering_connection.coursepass_peering.id
}

# 3. Add return route in CoursePass route table to reach FacePass VPC (10.0.0.0/16)
resource "aws_route" "coursepass_to_facepass" {
  route_table_id            = var.coursepass_route_table_id
  destination_cidr_block    = var.vpc_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.coursepass_peering.id
}
