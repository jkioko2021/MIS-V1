<%@ Page Title="" Language="VB" MasterPageFile="~/MasterPage.master" AutoEventWireup="false" CodeFile="Business_Tracking_Shwaari_status.aspx.vb" Inherits="_Default" %>

<%@ OutputCache Location="None" %>
<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="cc1" %>
<%@ Register assembly="Telerik.Web.UI" namespace="Telerik.Web.UI" tagprefix="telerik" %>
<asp:Content ID="Content1" ContentPlaceHolderID="ContentPlaceHolder1" Runat="Server">
    <asp:UpdateProgress ID="UpdateProgress1" runat="server">
        <ProgressTemplate>
         <asp:Label ID="lblProgress" runat="server" Font-Bold="True" ForeColor="Red" 
                Text="Please Wait...." Font-Size="Medium"></asp:Label>
        </ProgressTemplate>
    </asp:UpdateProgress>
    <asp:UpdatePanel ID="UpdatePanel1" runat="server">
                <ContentTemplate>
                    <div align="center">
                    
                    <asp:Panel ID="Panel1" runat="server" BorderStyle="Solid" BorderWidth="1px" 
                        Width="1176px">
                 
                 <table style="width: 96%; margin-left: 0px;" align="center">
                                <tr>
                                    <td class="style8">
                                   
                            <table style="1100: ;">
                                <tr>
                                    <td align="center" bgcolor="#CCCCCC">
                                        <asp:Label ID="Label135" runat="server" Font-Bold="True" 
                                            Text="SHWAARI BUSINESS STATUS" Font-Size="Medium"></asp:Label>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center">
                                        <table style="width: 1132px">
                                            <tr>
                                                <td align="right" style="width: 3282px">
                                                    <asp:Label ID="Label141" runat="server" Text="Search by"></asp:Label>
                                                </td>
                                                <td align="right" style="width: 1025px">
                                                    &nbsp;</td>
                                                <td style="width: 125px">
                                                    <telerik:RadComboBox ID="cbosearch" Runat="server" Skin="Sunset" Width="190px">
                                                        <Items>
                                                            <telerik:RadComboBoxItem runat="server" Text="Proposer Name" Value="P" />
                                                            <telerik:RadComboBoxItem runat="server" Text="File No." Value="F" />
                                                        </Items>
                                                    </telerik:RadComboBox>
                                                </td>
                                                <td style="width: 264px">
                                                    <telerik:RadTextBox ID="txtsearch" Runat="server" Skin="Sunset" Width="250px">
                                                    </telerik:RadTextBox>
                                                </td>
                                                <td>
                                                    <telerik:RadButton ID="btnsearch" runat="server" Skin="Simple" Text="Search">
                                                    </telerik:RadButton>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="width: 3282px">
                                                    <asp:Label ID="FILE_NO" runat="server" Font-Bold="True" Font-Size="Medium" 
                                                        style="font-weight: 700; color: #CC0000; background-color: #FFFFFF"></asp:Label>
                                                </td>
                                                <td style="width: 1025px">
                                                    &nbsp;</td>
                                                <td style="width: 125px">
                                                    &nbsp;</td>
                                                <td style="width: 264px">
                                                    &nbsp;</td>
                                                <td>
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td colspan="5">
                                                    <asp:Panel ID="Panel11" runat="server" Height="100%" ScrollBars="Both" 
                                                        Width="1128px">
                                                        <telerik:RadGrid ID="GDTracking" runat="server" AllowPaging="True" 
                                                            CellSpacing="0" GridLines="None" Height="100%" PageSize="20" Skin="WebBlue" 
                                                            Width="100%">
                                                            <MasterTableView AutoGenerateColumns="False" DataKeyNames="File_No">
                                                                <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                    <HeaderStyle Width="20px" />
                                                                </RowIndicatorColumn>
                                                                <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                    <HeaderStyle Width="20px" />
                                                                </ExpandCollapseColumn>
                                                                <Columns>
                                                                    <telerik:GridButtonColumn CommandName="Select" 
                                                                        FilterControlAltText="Filter Select column" HeaderText="Select" Text="Select" 
                                                                        UniqueName="Select">
                                                                        <HeaderStyle ForeColor="Blue" Width="100px" />
                                                                        <ItemStyle Width="50px" />
                                                                    </telerik:GridButtonColumn>
                                                                    <telerik:GridBoundColumn DataField="Receive_dt" 
                                                                        FilterControlAltText="Filter Receive_dt column" HeaderText="Receive_dt" 
                                                                        SortExpression="Receive_dt" UniqueName="Receive_dt">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="File_No" 
                                                                        FilterControlAltText="Filter File_No column" HeaderText="File_No" 
                                                                        SortExpression="File_No" UniqueName="File_No">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Premium" 
                                                                        FilterControlAltText="Filter Premium column" HeaderText="Premium" 
                                                                        SortExpression="Premium" UniqueName="Premium">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="eOx_Invoice_No" 
                                                                        FilterControlAltText="Filter eOx_Invoice_No column" HeaderText="Invoice_No" 
                                                                        SortExpression="eOx_Invoice_No" UniqueName="eOx_Invoice_No">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Proposer_Name" 
                                                                        FilterControlAltText="Filter Proposer_Name column" HeaderText="Proposer_Name" 
                                                                        SortExpression="Proposer_Name" UniqueName="Proposer_Name">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Client_Type" 
                                                                        FilterControlAltText="Filter Client_Type column" HeaderText="Client_Type" 
                                                                        SortExpression="Client_Type" UniqueName="Client_Type">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Business_Type" 
                                                                        FilterControlAltText="Filter Business_Type column" HeaderText="Type" 
                                                                        SortExpression="Business_Type" UniqueName="Business_Type">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="File_Status" 
                                                                        FilterControlAltText="Filter File_Status column" HeaderText="Status" 
                                                                        SortExpression="File_Status" UniqueName="File_Status">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Allocated_to" 
                                                                        FilterControlAltText="Filter Allocated_to column" HeaderText="Allocated_to" 
                                                                        SortExpression="Allocated_to" UniqueName="Allocated_to">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Product" 
                                                                        FilterControlAltText="Filter Product column" HeaderText="Product" 
                                                                        SortExpression="Product" UniqueName="Product">
                                                                    </telerik:GridBoundColumn>
                                                                           <telerik:GridBoundColumn DataField="Syst" 
                                                                        FilterControlAltText="Filter Syst column" HeaderText="System" 
                                                                        SortExpression="Syst" UniqueName="Syst">
                                                                    </telerik:GridBoundColumn>
                                                                </Columns>
                                                                <EditFormSettings>
                                                                    <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                    </EditColumn>
                                                                </EditFormSettings>
                                                            </MasterTableView>
                                                            <ItemStyle Wrap="False" />
                                                            <FilterMenu EnableImageSprites="False">
                                                            </FilterMenu>
                                                            <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                            </HeaderContextMenu>
                                                        </telerik:RadGrid>
                                                    </asp:Panel>
                                                </td>
                                            </tr>
                                            <tr>
                                               
                                                <td colspan="5">
                                                    <asp:Panel ID="Panel4" runat="server">
                                                        <table style="width: 99%">
                                                            <tr>
                                                                <td>
                                                                    <asp:Label ID="Label178" runat="server" Font-Bold="True" 
                                                                        Text="AAR Shwaari Proposer"></asp:Label>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td>
                                                                    <asp:Panel ID="Panel37" runat="server" Height="100%" ScrollBars="Both" 
                                                                        Width="1128px">
                                                                        <telerik:RadGrid ID="GD_PROPOSER" runat="server" AllowPaging="True" 
                                                                            CellSpacing="0" GridLines="None" Height="100%" PageSize="20" Skin="WebBlue" 
                                                                            Width="100%">
                                                                            <MasterTableView AutoGenerateColumns="False">
                                                                                <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                                <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                                    <HeaderStyle Width="20px" />
                                                                                </RowIndicatorColumn>
                                                                                <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                                    <HeaderStyle Width="20px" />
                                                                                </ExpandCollapseColumn>
                                                                                <Columns>
                                                                                    <telerik:GridBoundColumn DataField="shwaari_code" 
                                                                                        FilterControlAltText="Filter shwaari_code column" HeaderText="File_No" 
                                                                                        SortExpression="shwaari_code" UniqueName="shwaari_code">
                                                                                    </telerik:GridBoundColumn>
                                                                                    <telerik:GridBoundColumn DataField="proposer" 
                                                                                        FilterControlAltText="Filter proposer column" HeaderText="proposer" 
                                                                                        SortExpression="proposer" UniqueName="proposer">
                                                                                    </telerik:GridBoundColumn>
                                                                                    <telerik:GridBoundColumn DataField="cover_type" 
                                                                                        FilterControlAltText="Filter cover_type column" HeaderText="cover_type" 
                                                                                        SortExpression="cover_type" UniqueName="cover_type">
                                                                                    </telerik:GridBoundColumn>
                                                                                    <telerik:GridBoundColumn DataField="family_size" 
                                                                                        FilterControlAltText="Filter family_size column" HeaderText="family_size" 
                                                                                        SortExpression="family_size" UniqueName="family_size">
                                                                                    </telerik:GridBoundColumn>
                                                                                    <telerik:GridBoundColumn DataField="plan_name" 
                                                                                        FilterControlAltText="Filter plan_name column" HeaderText="plan_name" 
                                                                                        SortExpression="plan_name" UniqueName="plan_name">
                                                                                    </telerik:GridBoundColumn>
                                                                                    <telerik:GridBoundColumn DataField="plan_limit" 
                                                                                        DataFormatString="{0:###.##0.0}" 
                                                                                        FilterControlAltText="Filter plan_limit column" HeaderText="plan_limit" 
                                                                                        SortExpression="plan_limit" UniqueName="plan_limit">
                                                                                    </telerik:GridBoundColumn>
                                                                                    <telerik:GridBoundColumn DataField="age_band" 
                                                                                        FilterControlAltText="Filter age_band column" HeaderText="age_band" 
                                                                                        SortExpression="age_band" UniqueName="age_band">
                                                                                    </telerik:GridBoundColumn>
                                                                                    <telerik:GridBoundColumn DataField="premium_amount" 
                                                                                        DataFormatString="{0:### ##0.0}" 
                                                                                        FilterControlAltText="Filter premium_amount column" HeaderText="premium" 
                                                                                        SortExpression="premium_amount" UniqueName="premium_amount">
                                                                                    </telerik:GridBoundColumn>
                                                                                    <telerik:GridBoundColumn DataField="levy_vat" 
                                                                                        FilterControlAltText="Filter levy_vat column" HeaderText="levy_vat" 
                                                                                        SortExpression="levy_vat" UniqueName="levy_vat">
                                                                                    </telerik:GridBoundColumn>
                                                                                    <telerik:GridBoundColumn DataField="levy_ext" 
                                                                                        FilterControlAltText="Filter levy_ext column" HeaderText="levy_ext" 
                                                                                        SortExpression="levy_ext" UniqueName="levy_ext">
                                                                                    </telerik:GridBoundColumn>
                                                                                    <telerik:GridBoundColumn DataField="stamp_duty" 
                                                                                        FilterControlAltText="Filter stamp_duty column" HeaderText="stamp_duty" 
                                                                                        SortExpression="stamp_duty" UniqueName="stamp_duty">
                                                                                    </telerik:GridBoundColumn>
                                                                                    <telerik:GridBoundColumn DataField="total_amount" 
                                                                                        DataFormatString="{0:### ##0.0}" 
                                                                                        FilterControlAltText="Filter total_amount column" HeaderText="total_amount" 
                                                                                        SortExpression="total_amount" UniqueName="total_amount">
                                                                                    </telerik:GridBoundColumn>
                                                                                    <telerik:GridBoundColumn DataField="agent" 
                                                                                        FilterControlAltText="Filter agent column" HeaderText="agent" 
                                                                                        SortExpression="agent" UniqueName="agent">
                                                                                    </telerik:GridBoundColumn>
                                                                                    <telerik:GridBoundColumn DataField="proposer_dob" 
                                                                                        FilterControlAltText="Filter proposer_dob column" HeaderText="proposer_dob" 
                                                                                        SortExpression="proposer_dob" UniqueName="proposer_dob">
                                                                                    </telerik:GridBoundColumn>
                                                                                    <telerik:GridBoundColumn DataField="application_date" 
                                                                                        FilterControlAltText="Filter application_date column" 
                                                                                        HeaderText="application_date" SortExpression="application_date" 
                                                                                        UniqueName="application_date">
                                                                                    </telerik:GridBoundColumn>
                                                                                </Columns>
                                                                                <EditFormSettings>
                                                                                    <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                                    </EditColumn>
                                                                                </EditFormSettings>
                                                                            </MasterTableView>
                                                                            <ItemStyle Wrap="False" />
                                                                            <FilterMenu EnableImageSprites="False">
                                                                            </FilterMenu>
                                                                            <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                                            </HeaderContextMenu>
                                                                        </telerik:RadGrid>
                                                                    </asp:Panel>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td>
                                                                    <asp:Label ID="Label2" runat="server" Font-Bold="True" 
                                                                        Text="AAR Shwaari Members"></asp:Label>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td>
                                                                    <asp:Panel ID="Panel5" runat="server" Height="100%" ScrollBars="Both" 
                                                                        Width="1128px">
                                                                        <telerik:RadGrid ID="GD_PROTECT" runat="server" AllowPaging="True" 
                                                                            CellSpacing="0" GridLines="None" Height="100%" PageSize="20" Skin="WebBlue" 
                                                                            Width="100%">
                                                                            <MasterTableView AutoGenerateColumns="False">
                                                                                <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                                <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                                    <HeaderStyle Width="20px" />
                                                                                </RowIndicatorColumn>
                                                                                <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                                    <HeaderStyle Width="20px" />
                                                                                </ExpandCollapseColumn>
                                                                                <Columns>
                                                                                    <telerik:GridBoundColumn DataField="shwaari_code" 
                                                                                        FilterControlAltText="Filter shwaari_code column" HeaderText="File_No" 
                                                                                        SortExpression="shwaari_code" UniqueName="shwaari_code">
                                                                                    </telerik:GridBoundColumn>
                                                                                    <telerik:GridBoundColumn DataField="relation" 
                                                                                        FilterControlAltText="Filter relation column" HeaderText="relation" 
                                                                                        SortExpression="relation" UniqueName="relation">
                                                                                    </telerik:GridBoundColumn>
                                                                                    <telerik:GridBoundColumn DataField="firstname" 
                                                                                        FilterControlAltText="Filter firstname column" HeaderText="firstname" 
                                                                                        SortExpression="firstname" UniqueName="firstname">
                                                                                    </telerik:GridBoundColumn>
                                                                                    <telerik:GridBoundColumn DataField="lastname" 
                                                                                        FilterControlAltText="Filter lastname column" HeaderText="lastname" 
                                                                                        SortExpression="lastname" UniqueName="lastname">
                                                                                    </telerik:GridBoundColumn>
                                                                                    <telerik:GridBoundColumn DataField="phone" 
                                                                                        FilterControlAltText="Filter phone column" HeaderText="phone" 
                                                                                        SortExpression="phone" UniqueName="phone">
                                                                                    </telerik:GridBoundColumn>
                                                                                    <telerik:GridBoundColumn DataField="email" 
                                                                                        FilterControlAltText="Filter email column" HeaderText="email" 
                                                                                        SortExpression="email" UniqueName="email">
                                                                                    </telerik:GridBoundColumn>
                                                                                    <telerik:GridBoundColumn DataField="id_number" 
                                                                                        FilterControlAltText="Filter id_number column" HeaderText="id_number" 
                                                                                        SortExpression="id_number" UniqueName="id_number">
                                                                                    </telerik:GridBoundColumn>
                                                                                    <telerik:GridBoundColumn DataField="Gender" 
                                                                                        FilterControlAltText="Filter Gender column" HeaderText="Gender" 
                                                                                        SortExpression="Gender" UniqueName="Gender">
                                                                                    </telerik:GridBoundColumn>
                                                                                    <telerik:GridBoundColumn DataField="dob" 
                                                                                        FilterControlAltText="Filter dob column" HeaderText="dob" SortExpression="dob" 
                                                                                        UniqueName="dob">
                                                                                    </telerik:GridBoundColumn>
                                                                                    <telerik:GridBoundColumn DataField="date_added" 
                                                                                        FilterControlAltText="Filter date_added column" HeaderText="date_added" 
                                                                                        SortExpression="date_added" UniqueName="date_added">
                                                                                    </telerik:GridBoundColumn>
                                                                                </Columns>
                                                                                <EditFormSettings>
                                                                                    <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                                    </EditColumn>
                                                                                </EditFormSettings>
                                                                            </MasterTableView>
                                                                            <ItemStyle Wrap="False" />
                                                                            <FilterMenu EnableImageSprites="False">
                                                                            </FilterMenu>
                                                                            <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                                            </HeaderContextMenu>
                                                                        </telerik:RadGrid>
                                                                    </asp:Panel>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td>
                                                                    <asp:Label ID="Label179" runat="server" Font-Bold="True" 
                                                                        Text="AAR Shwaari Payment"></asp:Label>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td>
                                                                    <asp:Panel ID="Panel38" runat="server" Height="100%" ScrollBars="Both" 
                                                                        Width="1128px">
                                                                        <telerik:RadGrid ID="GD_Shwaari_Pay" runat="server" AllowPaging="True" 
                                                                            CellSpacing="0" GridLines="None" Height="100%" PageSize="20" Skin="WebBlue" 
                                                                            Width="100%">
                                                                            <MasterTableView AutoGenerateColumns="False">
                                                                                <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                                <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                                    <HeaderStyle Width="20px" />
                                                                                </RowIndicatorColumn>
                                                                                <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                                    <HeaderStyle Width="20px" />
                                                                                </ExpandCollapseColumn>
                                                                                <Columns>
                                                                                    <telerik:GridBoundColumn DataField="shwaari_code" 
                                                                                        FilterControlAltText="Filter shwaari_code column" HeaderText="File_No" 
                                                                                        SortExpression="shwaari_code" UniqueName="shwaari_code">
                                                                                    </telerik:GridBoundColumn>
                                                                                    <telerik:GridBoundColumn DataField="payment_code" 
                                                                                        FilterControlAltText="Filter payment_code column" HeaderText="payment_code" 
                                                                                        SortExpression="payment_code" UniqueName="payment_code">
                                                                                    </telerik:GridBoundColumn>
                                                                                    <telerik:GridBoundColumn DataField="amount" DataFormatString="{0:### ##0.0}" 
                                                                                        FilterControlAltText="Filter amount column" HeaderText="Paid_Amt" 
                                                                                        SortExpression="amount" UniqueName="amount">
                                                                                    </telerik:GridBoundColumn>
                                                                                    <telerik:GridBoundColumn DataField="payment_method" 
                                                                                        FilterControlAltText="Filter payment_method column" HeaderText="payment_method" 
                                                                                        SortExpression="payment_method" UniqueName="payment_method">
                                                                                    </telerik:GridBoundColumn>
                                                                                    <telerik:GridBoundColumn DataField="payment_date" 
                                                                                        FilterControlAltText="Filter payment_date column" HeaderText="payment_date" 
                                                                                        SortExpression="payment_date" UniqueName="payment_date">
                                                                                    </telerik:GridBoundColumn>
                                                                                </Columns>
                                                                                <EditFormSettings>
                                                                                    <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                                    </EditColumn>
                                                                                </EditFormSettings>
                                                                            </MasterTableView>
                                                                            <ItemStyle Wrap="False" />
                                                                            <FilterMenu EnableImageSprites="False">
                                                                            </FilterMenu>
                                                                            <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                                            </HeaderContextMenu>
                                                                        </telerik:RadGrid>
                                                                    </asp:Panel>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td>
                                                                    <asp:Label ID="Label3" runat="server" Text="Total Paid Amt:"></asp:Label>
                                                                    &nbsp;<telerik:RadNumericTextBox ID="RadNumericTextBox1" Runat="server" 
                                                                        Culture="en-US" Skin="Sunset" Value="0" Width="200px">
                                                                    </telerik:RadNumericTextBox>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </asp:Panel>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                                          </td>
                                          </tr>
                                          <tr>
                                              <td>
                                              </td>
                                          </tr>
                                          <tr>
                                              <td bgcolor="#666666">
                                                  &nbsp;</td>
                                          </tr>
                                          <tr>
                                              <td style="height: 34px">
                                                  <table style="width: 100%">
                                                      <tr>
                                                          <td style="width: 193px">
                                                              <asp:Label ID="Label154" runat="server" Text="Entered By"></asp:Label>
                                                          </td>
                                                          <td style="width: 246px">
                                                              <asp:Label ID="lblenteredby" runat="server"></asp:Label>
                                                          </td>
                                                          <td>
                                                              <asp:Label ID="Label155" runat="server" Text="updated by"></asp:Label>
                                                          </td>
                                                          <td>
                                                              <asp:Label ID="lblupdateby" runat="server"></asp:Label>
                                                          </td>
                                                      </tr>
                                                      <tr>
                                                          <td style="width: 193px">
                                                              &nbsp;</td>
                                                          <td style="width: 246px">
                                                              &nbsp;</td>
                                                          <td>
                                                              &nbsp;</td>
                                                          <td>
                                                              &nbsp;</td>
                                                      </tr>
                                                  </table>
                                              </td>
                                          </tr>
                                          <tr>
                                              <td style="height: 41px">
                                                  &nbsp;<asp:Label ID="lblerr" runat="server" Font-Bold="True" Font-Size="Medium" 
                                                      ForeColor="Red"></asp:Label>
                                                  <asp:HiddenField ID="HiddenField1" runat="server" />
                                              </td>
                                          </tr>
                                          <tr>
                                              <td>
                                                  <asp:Panel ID="Panel15" runat="server" Height="100%" ScrollBars="Both" 
                                                      Width="100%">
                                                      <telerik:RadGrid ID="GDNOTES" runat="server" AllowPaging="True" CellSpacing="0" 
                                                          GridLines="None" Height="100%" Skin="WebBlue" Width="100%">
                                                          <MasterTableView AutoGenerateColumns="False">
                                                              <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                              <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                              </RowIndicatorColumn>
                                                              <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                              </ExpandCollapseColumn>
                                                              <Columns>
                                                                  <telerik:GridBoundColumn DataField="Note_date" 
                                                                      FilterControlAltText="Filter Note_date column" HeaderText="Note date" 
                                                                      ItemStyle-Width="100" SortExpression="Note_date" UniqueName="Note_date">
                                                                      <ItemStyle Width="100px" />
                                                                  </telerik:GridBoundColumn>
                                                                  <telerik:GridBoundColumn DataField="File_No" 
                                                                      FilterControlAltText="Filter File_No column" HeaderText="File No" 
                                                                      ItemStyle-Width="50" SortExpression="File_No" UniqueName="File_No">
                                                                      <ItemStyle Width="50px" />
                                                                  </telerik:GridBoundColumn>
                                                                  <telerik:GridBoundColumn DataField="Note_From" 
                                                                      FilterControlAltText="Filter Note_From column" HeaderText="From" 
                                                                      ItemStyle-Width="100" SortExpression="Note_From" UniqueName="Note_From">
                                                                      <ItemStyle Width="100px" />
                                                                  </telerik:GridBoundColumn>
                                                                  <telerik:GridBoundColumn DataField="Notes" 
                                                                      FilterControlAltText="Filter Notes column" HeaderText="Notes" 
                                                                      SortExpression="Notes" UniqueName="Notes">
                                                                  </telerik:GridBoundColumn>
                                                              </Columns>
                                                              <EditFormSettings>
                                                                  <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                  </EditColumn>
                                                              </EditFormSettings>
                                                          </MasterTableView>
                                                          <ItemStyle Wrap="False" />
                                                          <FilterMenu EnableImageSprites="False">
                                                          </FilterMenu>
                                                          <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                          </HeaderContextMenu>
                                                      </telerik:RadGrid>
                                                  </asp:Panel>
                                              </td>
                                          </tr>
                                          </table>
                      
   </asp:Panel>
   </div>
            </ContentTemplate>
       
            </asp:UpdatePanel>
</asp:Content>
