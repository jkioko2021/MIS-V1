<%@ Page Title="" Language="VB" MasterPageFile="~/MasterPage.master" AutoEventWireup="false" CodeFile="AssignAdminAccessProfile.aspx.vb" Inherits="_Default" %>
<%@ OutputCache Location="None" %>
<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="cc1" %>
<%@ Register assembly="Telerik.Web.UI" namespace="Telerik.Web.UI" tagprefix="telerik" %>

<asp:Content ID="Content1" ContentPlaceHolderID="ContentPlaceHolder1" Runat="Server">
    
  <div id="Master_div">

           <table width="100%">
                <tbody>
                    <tr>
                        <td colspan="3" style="height: 70px">
                            <strong><span style="font-size: 10pt; color: #153e7e">Profile Name</span></strong>
                            <asp:DropDownList ID="DropDownProfile" runat="server" AutoPostBack="True" 
                                BackColor="White" CssClass="tinyText" Font-Size="Small" 
                                OnSelectedIndexChanged="DropDownProfile_SelectedIndexChanged1" Width="256px">
                            </asp:DropDownList>
                            <asp:RequiredFieldValidator ID="RequiredFieldValidator1" runat="server" 
                                ControlToValidate="DropDownProfile" 
                                ErrorMessage="Please Select a Profile Before Proceeding" Font-Size="Small" 
                                Width="232px"></asp:RequiredFieldValidator>
                        </td>
                    </tr>
                    <tr>
                        <td valign="top" class="style16" style="height: 24px; width: 92px">
                            <asp:Button ID="CmdSave" runat="server" CssClass="box1" Height="32px" 
                                OnClick="CmdSave_Click" Text="Save Details" Width="152px" />
                            <cc1:ConfirmButtonExtender ID="ConfirmButtonExtender1" runat="server" 
                                ConfirmText="Are you Sure you want to Save?" TargetControlID="CmdSave">
                            </cc1:ConfirmButtonExtender>
                        </td>
                        <td style="width: 60px; height: 24px;" valign="top">
                            &nbsp;</td>
                        <td style="width: 264px; text-align: right; height: 24px;" valign="top">
                            <asp:HiddenField ID="HiddenField1" runat="server" />
                        </td>
                    </tr>
                    <tr>
                        <td class="style16" style="height: 24px; width: 92px" valign="top">
                            <asp:TreeView ID="TreeView1" runat="server" BackColor="White" 
                                BorderColor="#404040" BorderStyle="Solid" BorderWidth="1px" Font-Size="8pt" 
                                ForeColor="#333333" Height="100%" PopulateNodesFromClient="False" 
                                ShowCheckBoxes="All" ShowLines="True" Width="100%">
                                <ParentNodeStyle BackColor="#FFFFC0" ForeColor="Black" />
                                <Nodes>
                                    <asp:TreeNode Text="PROCESS REQUEST" Value="PROCESS REQUEST">
                                        <asp:TreeNode ShowCheckBox="True" Text="Card Request" Value="Search">
                                        </asp:TreeNode>
                                        <asp:TreeNode Expanded="False" Text="Approve/Reject" Value="Approve/Reject">
                                        </asp:TreeNode>
                                        <asp:TreeNode Expanded="False" Text="Upload File/Post" Value="Upload File/Post">
                                        </asp:TreeNode>
                                    </asp:TreeNode>
                                    <asp:TreeNode SelectAction="None" Text="BACKOFFICE" Value="BACKOFFICE">
                                        <asp:TreeNode Text="Import Customer Details" Value="Import Customer Details">
                                        </asp:TreeNode>
                                        <asp:TreeNode Text="Branch Defination" Value="Branch Defination"></asp:TreeNode>
                                        <asp:TreeNode Text="Card Type Defination" Value="Card Type Defination">
                                        </asp:TreeNode>
                                    </asp:TreeNode>
                                    <asp:TreeNode Text="USER MANAGEMENT" Value="USER MANAGEMENT">
                                        <asp:TreeNode Text="Create User Group" Value="Create User Group"></asp:TreeNode>
                                        <asp:TreeNode Text="Create Security Profile" Value="Create Security Profile">
                                        </asp:TreeNode>
                                        <asp:TreeNode Text="Create a User" Value="Create a User"></asp:TreeNode>
                                        <asp:TreeNode NavigateUrl="~/AssignRights.aspx" Text="Assign Access Rights" 
                                            Value="Assign Access Rights"></asp:TreeNode>
                                    </asp:TreeNode>
                                    <asp:TreeNode Text="QUERY" Value="QUERY">
                                        <asp:TreeNode ShowCheckBox="True" Text="Search" Value="Search"></asp:TreeNode>
                                    </asp:TreeNode>
                                    <asp:TreeNode Text="REPORTS" Value="REPORTS">
                                        <asp:TreeNode Expanded="True" Text="Card Request Reports" 
                                            Value="Card Request Reports"></asp:TreeNode>
                                    </asp:TreeNode>
                                </Nodes>
                                <RootNodeStyle BackColor="WhiteSmoke" BorderColor="Black" BorderStyle="Solid" 
                                    BorderWidth="1pt" Font-Size="10pt" Width="600px" />
                            </asp:TreeView>
                        </td>
                        <td style="width: 60px; height: 24px;" valign="top">
                            &nbsp;</td>
                        <td style="width: 264px; text-align: right; height: 24px;" valign="top">
                            &nbsp;</td>
                    </tr>
                    <tr>
                        <td colspan="3" style="height: 55px" valign="bottom" class="style16">
                            <asp:Label ID="Label1" runat="server" Font-Size="Small" ForeColor="Red" 
                                Width="632px"></asp:Label>
                        </td>
                    </tr>
                    <tr>
                        <td colspan="3" style="height: 16px" valign="bottom">
                            <telerik:RadButton ID="RadButton2" runat="server" Skin="Simple" 
                                Text="export User Listing">
                            </telerik:RadButton>
                        </td>
                    </tr>
                    <tr>
                        <td colspan="3" style="height: 16px" valign="bottom">
                            &nbsp;</td>
                    </tr>
                </tbody>
            </table>
   </div>
    
</asp:Content>

